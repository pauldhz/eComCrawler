# Installation

> Ces étapes sont requises en plus de `npm install`.

## Local (macOS / Windows)

```bash
npx playwright install chromium
```

## Serveur Linux (VPS, EC2, etc.)

```bash
npx playwright install --with-deps chromium
```

## Docker

Ajoute dans ton `Dockerfile` :

```dockerfile
RUN npx playwright install --with-deps chromium
```

## CI/CD (ex: GitHub Actions)

```yaml
- run: npx playwright install --with-deps chromium
```
