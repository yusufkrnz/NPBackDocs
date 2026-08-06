# NPBackDocs

`NewPortal-Backend` için Docusaurus dokümantasyon sitesi.

## Yapı

- `docs/guides/` — kod yazma standartları, mimari rehberler (elle yazılır)
- `docs/services/` — her servisin sorumluluğu, bağımlılıkları, endpoint tablosu (elle yazılır)
- `docs/use-cases/` — uçtan uca senaryolar, sequence diagram (elle yazılır)
- Canlı API referansı elle yazılmaz — FastAPI'nin ürettiği `/docs` ve `/redoc`'a link verilir (bkz. `docs/guides/api-reference.mdx`)

## Geliştirme

```bash
npm install
npm start
```

## Build

```bash
npm run build
```
