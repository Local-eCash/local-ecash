# Ecash escrow

## Structure

```
.
├── ...
├── apps
│   ├── telegram-ecash-escrow                  # NextJS App
├── packages
│   ├── api                   # Shared API config & models
├── docs                      # 📚 Technical documentation
└── ...
```

## Documentation

Comprehensive technical documentation is available in the [`docs`](./docs) folder:

- **Feature Implementation**: Complete guides for new features
- **Backend Changes**: API specifications and implementation guides
- **Bug Fixes**: Detailed bug fix documentation with examples
- **Testing Plans**: Test scenarios and procedures
- **Critical Issues**: Active issues requiring immediate attention

See [`docs/README.md`](./docs/README.md) for the complete documentation index.

## Development

You can run all apps at once:

```bash
pnpm dev
```

... or run one app only:

```bash
pnpm dev:next
```

Make sure to refer to the available scripts in `package.json`.
