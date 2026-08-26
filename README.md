# Biblioteca – Plataforma de Gestión

Plataforma web para la gestión integral de una biblioteca: administración de usuarios, catálogo de libros con portadas, control de ejemplares disponibles y préstamos. Incluye catálogo público, módulo de administración y trazabilidad de préstamos por usuario y ejemplar.

## Instrucciones de Despliegue Local (Docker)

Prerrequisitos: Tener Docker y Docker Compose instalados en tu sistema.

### 1. Variables de Entorno

Configurar los archivos `.env` a partir de los `.env.example` correspondientes en el repositorio.
Puedes copiarlos rápidamente usando este comando:

```bash
cp .env.example .env

```

- `VITE_API_URL`: URL base de la API (ejemplo: `http://localhost:8080`)

### 2. Levantar la Infraestructura

Una vez configuradas las variables de entorno, compila y levanta todos los servicios en segundo plano con el siguiente comando:

```bash
docker compose up -d --build

```

**Accesos por defecto:**

- Frontend: `http://localhost:3000`
- API Backend: `http://localhost:8080`
- PostgreSQL: `localhost:5432`

### 3. Restauración de Datos de Prueba

El repositorio incluye un archivo de prueba en la ruta `db-backup/backup.dump`. Para restaurar esta data inicial dentro del contenedor, ejecuta el siguiente comando:

**En Linux / Mac / CMD (Windows):**

```bash
docker compose exec -T db psql -U postgres -d library_db < db-backup/backup.dump

```

> **Nota para usuarios de PowerShell (Windows):** El operador `<` no está soportado. Utiliza este comando en su lugar:
>
> ```powershell
> Get-Content db-backup/backup.dump | docker compose exec -T db psql -U postgres -d library_db
>
> ```

## Arquitectura y Tecnologías Usadas

El proyecto mantiene una separación clara de responsabilidades: el backend expone la API REST, el frontend la consume vía cliente Axios centralizado, y ambos se despliegan como contenedores independientes.

- **Backend:** Spring Boot 3, Java 17. Encargado de la API REST, validación y persistencia de datos.
- **Frontend:** React, TypeScript, Vite. Aplicación SPA (Single Page Application) utilizando React Router y Axios.
- **Base de datos:** PostgreSQL. Encargada de la persistencia relacional.
- **Infraestructura:** Docker, Docker Compose, Nginx. Orquestación general y servidor web para los archivos estáticos del frontend.
