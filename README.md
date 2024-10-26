# Emergency Relief DAO

A decentralized autonomous organization (DAO) built on the Stacks blockchain for managing and distributing emergency relief funds. The system enables transparent, community-driven decision-making for emergency fund allocation.

## Overview

The Emergency Relief DAO allows community members to:
- Submit emergency relief claims
- Vote on fund allocation
- Track fund distribution
- Participate in decentralized governance

### Key Features

- **Decentralized Claim Management**: Anyone can submit claims for emergency relief
- **Community-Driven Voting**: Transparent voting system for fund allocation
- **Automated Distribution**: Smart contract-based fund distribution
- **Transparent Tracking**: All transactions and decisions are recorded on-chain
- **Configurable Parameters**: Adjustable voting periods, thresholds, and governance rules

## Technical Architecture

### Smart Contracts

The system consists of the following Clarity smart contracts:

```clarity
emergency-relief-dao.clar  # Main DAO contract
```

### Key Parameters

- Voting Period: 144 blocks (~24 hours)
- Minimum Votes Required: 3
- Approval Threshold: 75%

## Getting Started

### Prerequisites

- [Stacks CLI](https://docs.stacks.co/references/stacks-cli)
- Node.js v14+
- npm or yarn
- [Clarinet](https://github.com/hirosystems/clarinet) for Clarity contract development

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/emergency-relief-dao
cd emergency-relief-dao
```

2. Install dependencies:
```bash
npm install
```

3. Set up local development environment:
```bash
clarinet integrate
```

### Testing

Run the test suite:

```bash
npm test
```

This will execute the Vitest test suite covering:
- Contract deployment
- Claim submission
- Voting system
- Fund distribution
- Administrative functions

### Deployment

1. Configure your network in `Clarinet.toml`:
```toml
[network]
name = "mainnet"
```

2. Deploy contracts:
```bash
clarinet deploy --network mainnet
```

## Usage

### Submitting a Claim

```typescript
// Example using @stacks/transactions
import { callContractFunction, uintCV, stringAsciiCV } from '@stacks/transactions';

const submitClaim = async (amount, description, category) => {
  const result = await callContractFunction({
    contractName: 'emergency-relief-dao',
    functionName: 'submit-claim',
    functionArgs: [
      uintCV(amount),
      stringAsciiCV(description),
      stringAsciiCV(category)
    ],
    sender: userAddress,
  });
  return result;
};
```

### Voting on Claims

```typescript
const voteOnClaim = async (claimId, vote) => {
  const result = await callContractFunction({
    contractName: 'emergency-relief-dao',
    functionName: 'vote-on-claim',
    functionArgs: [uintCV(claimId), vote ? trueCV() : falseCV()],
    sender: userAddress,
  });
  return result;
};
```

## Security Considerations

- All funds are secured by smart contracts
- Multiple signature requirements for large transactions
- Timelock periods for governance changes
- Regular security audits recommended

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow [Clarity best practices](https://docs.stacks.co/clarity/overview)
- Add tests for new features
- Update documentation
- Follow conventional commits

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Project Status

Current Version: 1.0.0

- [x] Smart Contract Development
- [x] Test Suite
- [ ] Frontend Development
- [ ] Security Audit
- [ ] Mainnet Deployment

## Support

For support and discussions:
- Create an issue in the repository
- Join our [Discord community](#)
- Email: support@emergencyreliefdao.com

## Acknowledgments

- Stacks Foundation
- Open source contributors
- Community members

## Roadmap

### Phase 1 (Current)
- Basic DAO functionality
- Claim submission and voting
- Fund distribution

### Phase 2
- Enhanced governance features
- Multiple category support
- Integration with external data sources

### Phase 3
- Cross-chain compatibility
- Advanced analytics
- Mobile application

## FAQ

**Q: How are funds secured?**  
A: Funds are secured through smart contracts with multi-signature requirements and timelock periods.

**Q: Who can submit claims?**  
A: Any wallet address can submit claims, but approval requires community voting.

**Q: How long is the voting period?**  
A: The standard voting period is 24 hours (144 blocks).

## Contact

Project Maintainer: [Your Name](mailto:your.email@example.com)  
Project Link: [https://github.com/your-username/emergency-relief-dao](https://github.com/your-username/emergency-relief-dao)
