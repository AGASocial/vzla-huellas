# afis-matcher

Microservicio HTTP que envuelve [SourceAFIS](https://sourceafis.machinezoo.com/)
(matching real de huellas por minucias) para que el Next.js en Vercel pueda
usarlo sin necesitar una JVM propia.

Probado: con 3 fotos de dedos distintos, esta huella vs. esa huella da
score 0 (sin coincidencia); la misma imagen contra sí misma da ~1180 (el
umbral sugerido es 40). Ver `Main.SOURCEAFIS_THRESHOLD`.

## Endpoints

- `GET /health` → `ok`
- `POST /extract` - body: bytes crudos de la imagen → `{ "template": "<base64>" }`
- `POST /compare` - body: `{ "probe": "<base64>", "candidate": "<base64>" }` →
  `{ "score": number, "threshold": 40, "match": boolean }`

Si se define la variable de entorno `AFIS_TOKEN`, todos los endpoints
(excepto `/health`) requieren el header `Authorization: Bearer <token>`.

## Correr en local

```bash
mvn package
java -jar target/afis-matcher.jar
```

## Deploy en Fly.io (gratis para este volumen de tráfico)

```bash
brew install flyctl   # o ver https://fly.io/docs/flyctl/install/
fly auth login
cd services/afis-matcher
fly launch --no-deploy   # usa el fly.toml ya incluido, no sobreescribir
fly secrets set AFIS_TOKEN=$(openssl rand -hex 32)
fly deploy
```

Al terminar, `fly status` muestra la URL pública (algo como
`https://reencuentro-afis-matcher.fly.dev`). Copia esa URL y el `AFIS_TOKEN`
generado a las variables de entorno del proyecto Next.js
(`AFIS_SERVICE_URL` y `AFIS_SERVICE_TOKEN`, ver README principal).

## Deploy alternativo: Render

Si prefieres Render en vez de Fly.io: "New Web Service" → conectar este
subdirectorio (`services/afis-matcher`) → Environment: Docker → agregar la
variable de entorno `AFIS_TOKEN`. Render detecta el `Dockerfile`
automáticamente.
