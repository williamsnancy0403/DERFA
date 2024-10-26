import { describe, test, expect, beforeEach } from 'vitest';
import {
  Client,
  Provider,
  ProviderRegistry,
  Result
} from '@stacks/transactions';
import {
  deployContract,
  callContractFunction,
  createTransaction,
  broadcastTransaction,
  makeContractCall,
  bufferCV,
  standardPrincipalCV,
  uintCV,
  stringAsciiCV,
  someCV,
  noneCV,
  trueCV,
  falseCV
} from '@stacks/transactions';

describe('Emergency Relief DAO', () => {
  let client: Client;
  let provider: Provider;
  let deployer: string;
  let user1: string;
  let user2: string;
  let user3: string;
  
  beforeEach(async () => {
    // Setup test environment
    provider = await ProviderRegistry.createProvider({
      network: 'mocknet',
    });
    client = new Client({ provider });
    
    // Initialize test accounts
    [deployer, user1, user2, user3] = await client.getAccounts();
    
    // Deploy contract
    const contractName = 'emergency-relief-dao';
    const codeBody = '...'; // Contract code here
    await deployContract(contractName, codeBody, deployer);
  });
  
  describe('Claim Submission', () => {
    test('should successfully submit a valid claim', async () => {
      // Arrange
      const amount = uintCV(1000);
      const description = stringAsciiCV('Medical emergency expenses');
      const category = stringAsciiCV('medical');
      
      // Act
      const result = await callContractFunction({
        contractName: 'emergency-relief-dao',
        functionName: 'submit-claim',
        functionArgs: [amount, description, category],
        sender: user1,
      });
      
      // Assert
      expect(result.success).toBe(true);
      const claimId = result.value;
      
      const claim = await callContractFunction({
        contractName: 'emergency-relief-dao',
        functionName: 'get-claim',
        functionArgs: [claimId],
        sender: user1,
      });
      
      expect(claim.value.beneficiary).toBe(user1);
      expect(claim.value.amount).toBe(1000);
      expect(claim.value.status).toBe('pending');
    });
    
    test('should reject claim with invalid amount', async () => {
      // Arrange
      const amount = uintCV(0);
      const description = stringAsciiCV('Invalid claim');
      const category = stringAsciiCV('medical');
      
      // Act & Assert
      await expect(
          callContractFunction({
            contractName: 'emergency-relief-dao',
            functionName: 'submit-claim',
            functionArgs: [amount, description, category],
            sender: user1,
          })
      ).rejects.toThrow(/ERR-INVALID-AMOUNT/);
    });
  });
  
  describe('Voting System', () => {
    let claimId: number;
    
    beforeEach(async () => {
      // Setup a test claim
      const result = await callContractFunction({
        contractName: 'emergency-relief-dao',
        functionName: 'submit-claim',
        functionArgs: [
          uintCV(1000),
          stringAsciiCV('Test claim'),
          stringAsciiCV('medical')
        ],
        sender: user1,
      });
      claimId = result.value;
    });
    
    test('should allow valid vote on active claim', async () => {
      // Act
      const result = await callContractFunction({
        contractName: 'emergency-relief-dao',
        functionName: 'vote-on-claim',
        functionArgs: [uintCV(claimId), trueCV()],
        sender: user2,
      });
      
      // Assert
      expect(result.success).toBe(true);
      
      const claim = await callContractFunction({
        contractName: 'emergency-relief-dao',
        functionName: 'get-claim',
        functionArgs: [uintCV(claimId)],
        sender: user2,
      });
      
      expect(claim.value.yes-votes).toBe(1);
      expect(claim.value.total-votes).toBe(1);
    });
    
    test('should prevent double voting', async () => {
      // Arrange
      await callContractFunction({
        contractName: 'emergency-relief-dao',
        functionName: 'vote-on-claim',
        functionArgs: [uintCV(claimId), trueCV()],
        sender: user2,
      });
      
      // Act & Assert
      await expect(
          callContractFunction({
            contractName: 'emergency-relief-dao',
            functionName: 'vote-on-claim',
            functionArgs: [uintCV(claimId), trueCV()],
            sender: user2,
          })
      ).rejects.toThrow(/ERR-ALREADY-VOTED/);
    });
  });
  
  describe('Claim Finalization', () => {
    let claimId: number;
    
    beforeEach(async () => {
      // Setup test claim and votes
      const result = await callContractFunction({
        contractName: 'emergency-relief-dao',
        functionName: 'submit-claim',
        functionArgs: [
          uintCV(1000),
          stringAsciiCV('Test claim'),
          stringAsciiCV('medical')
        ],
        sender: user1,
      });
      claimId = result.value;
      
      // Add test funds
      await callContractFunction({
        contractName: 'emergency-relief-dao',
        functionName: 'deposit-funds',
        functionArgs: [uintCV(5000)],
        sender: deployer,
      });
      
      // Submit votes
      await Promise.all([
        callContractFunction({
          contractName: 'emergency-relief-dao',
          functionName: 'vote-on-claim',
          functionArgs: [uintCV(claimId), trueCV()],
          sender: user1,
        }),
        callContractFunction({
          contractName: 'emergency-relief-dao',
          functionName: 'vote-on-claim',
          functionArgs: [uintCV(claimId), trueCV()],
          sender: user2,
        }),
        callContractFunction({
          contractName: 'emergency-relief-dao',
          functionName: 'vote-on-claim',
          functionArgs: [uintCV(claimId), trueCV()],
          sender: user3,
        }),
      ]);
    });
    
    test('should approve claim with sufficient votes', async () => {
      // Arrange
      // Fast forward blockchain to pass voting period
      await provider.mineBlocks(145);
      
      // Act
      const result = await callContractFunction({
        contractName: 'emergency-relief-dao',
        functionName: 'finalize-claim',
        functionArgs: [uintCV(claimId)],
        sender: user2,
      });
      
      // Assert
      expect(result.success).toBe(true);
      
      const claim = await callContractFunction({
        contractName: 'emergency-relief-dao',
        functionName: 'get-claim',
        functionArgs: [uintCV(claimId)],
        sender: user2,
      });
      
      expect(claim.value.status).toBe('approved');
      
      const balance = await callContractFunction({
        contractName: 'emergency-relief-dao',
        functionName: 'get-fund-balance',
        functionArgs: [],
        sender: user2,
      });
      
      expect(balance.value).toBe(4000); // 5000 - 1000
    });
    
    test('should reject finalization before voting period ends', async () => {
      // Act & Assert
      await expect(
          callContractFunction({
            contractName: 'emergency-relief-dao',
            functionName: 'finalize-claim',
            functionArgs: [uintCV(claimId)],
            sender: user2,
          })
      ).rejects.toThrow(/ERR-CLAIM-EXPIRED/);
    });
  });
  
  describe('Fund Management', () => {
    test('should successfully deposit funds', async () => {
      // Act
      const result = await callContractFunction({
        contractName: 'emergency-relief-dao',
        functionName: 'deposit-funds',
        functionArgs: [uintCV(5000)],
        sender: deployer,
      });
      
      // Assert
      expect(result.success).toBe(true);
      
      const balance = await callContractFunction({
        contractName: 'emergency-relief-dao',
        functionName: 'get-fund-balance',
        functionArgs: [],
        sender: deployer,
      });
      
      expect(balance.value).toBe(5000);
    });
    
    test('should update DAO owner', async () => {
      // Act
      const result = await callContractFunction({
        contractName: 'emergency-relief-dao',
        functionName: 'update-dao-owner',
        functionArgs: [standardPrincipalCV(user1)],
        sender: deployer,
      });
      
      // Assert
      expect(result.success).toBe(true);
      
      // Verify new owner can perform admin functions
      const depositResult = await callContractFunction({
        contractName: 'emergency-relief-dao',
        functionName: 'deposit-funds',
        functionArgs: [uintCV(1000)],
        sender: user1,
      });
      
      expect(depositResult.success).toBe(true);
    });
  });
});
