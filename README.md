## Instrucciones de Ejecución y Despliegue

### Requisitos Previos

- Node.js (versión 18 o superior recomendada)
- Docker y Docker Compose (para despliegue contenerizado)

### Opción 1: Ejecución local en desarrollo

1. Clonar el repositorio e instalar las dependencias:

```bash
git clone <url-del-repositorio>
cd biblioteca-frontend
npm install

```

2. Configurar las variables de entorno basándose en el archivo `.env.example`:

```bash
cp .env.example .env

```

_(Asegúrate de apuntar la URL base de la API hacia tu backend local, por ejemplo: `VITE_API_URL=http://localhost:8080/api`)_ 3. Iniciar el servidor de desarrollo local con Vite:

```bash
npm run dev

```

### Opción 2: Despliegue con Docker (Recomendado para producción / pruebas)

1. Asegúrate de tener configurado el archivo de variables de entorno `.env` en la raíz del proyecto.
2. Levanta los contenedores utilizando Docker Compose:

```bash
docker compose up -d --build

```

3. La aplicación estará disponible en el puerto expuesto en tu configuración de Docker (por ejemplo: `http://localhost:3000`), sirviéndose a través de un servidor web Nginx optimizado para producción.

# Sistema de Gestión de Biblioteca - Frontend

Aplicación web desarrollada en **React** con **TypeScript**, diseñada para consumir la API REST del backend de gestión bibliotecaria. Permite administrar de forma integral usuarios, libros, ejemplares y préstamos bajo una interfaz moderna y responsiva.

---

## Tecnologías Utilizadas

- **React** (con Vite para un rendimiento óptimo)
- **TypeScript** (tipado estático para mayor robustez)
- **Axios / Fetch API** (comunicación HTTP con el backend)
- **Lucide React** (iconografía limpia y moderna)
- **Docker & Nginx** (orquestación y despliegue en contenedores)

---

## Funcionalidades Principales

### 1. Gestión de Libros

- Listado completo con tarjetas horizontales, transiciones y lazy loading de portadas reales integradas mediante la API pública de **Open Library**.
- Formulario inteligente de creación y edición con autocompletado de títulos asistido y validación estricta de campos (ISBN numérico de 13 dígitos, ediciones y fechas de publicación válidas).
- Filtro rápido para visualizar únicamente los libros con ejemplares disponibles.

### 2. Gestión de Usuarios

- CRUD completo para registrar, listar, editar y eliminar usuarios.
- Validaciones de campos obligatorios, control de correos únicos y formato de fecha de nacimiento.

### 3. Gestión de Préstamos

- Registro de préstamos seleccionando dinámicamente usuarios y ejemplares disponibles (`copies`) asociados a los libros.
- **Validaciones de negocio robustas:** El sistema bloquea automáticamente la creación de nuevos préstamos si el usuario posee libros en estado activo (`ACTIVE`) o vencido (`OVERDUE`).
- Búsqueda avanzada de préstamos filtrando por usuario o por libro de forma independiente.
- Gestión de devoluciones que actualiza en tiempo real el estado del préstamo a devuelto (`RETURNED`) y libera automáticamente la copia en el inventario.

---

## Arquitectura del Proyecto

El proyecto sigue una estructura modular y limpia basada en capas dentro del directorio `src/`:

```text
src/
├── components/       # Componentes visuales reutilizables (Layout principal)
├── layouts/          # Estructuras de contenedores de página (AppLayout)
├── pages/            # Vistas principales de la aplicación (Books, Loans, Users)
│   ├── Books/        # Submódulos y lógica de libros
│   ├── Loans/        # Submódulos y lógica de préstamos
│   └── Users/        # Submódulos y lógica de usuarios
├── services/         # Servicios de comunicación HTTP con Axios (api, bookService, loanService, userService)
├── types/            # Definición de interfaces y tipos globales en TypeScript
├── utils/            # Funciones de ayuda y utilidades de negocio
├── App.tsx           # Componente raíz y enrutamiento principal
├── index.css         # Estilos globales y clases CSS del sistema
└── main.tsx          # Punto de entrada de la aplicación React

```
