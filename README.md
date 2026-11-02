 
<div align="center">

# 📦 INAMBU WMS

### Sistema de Gestión y Control de Almacén

**Control de inventario, trazabilidad de lotes y gestión de movimientos en una aplicación de escritorio para Windows.**

<br/>

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7%2F8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-2-FFC131?style=for-the-badge&logo=tauri&logoColor=black)

<br/>

**Aplicación de escritorio · Windows · Gestión de inventarios**

</div>

---

## 📌 1. Acerca del proyecto

**INAMBU WMS** es un sistema de gestión de almacén desarrollado para optimizar el control y seguimiento de productos, lotes y movimientos de inventario.

La aplicación permite administrar las existencias, registrar entradas y salidas, controlar fechas de vencimiento y mantener la trazabilidad de los productos mediante una interfaz de escritorio.

El sistema está orientado a facilitar las operaciones de almacén, reducir errores en el registro de inventario y mejorar la organización de la información.

## ⚙️ 2. Funcionalidades principales

| Módulo | Descripción |
|---|---|
| 📦 Productos | Registro, consulta y administración de productos. |
| 🏷️ Lotes | Control de lotes, cantidades, fechas de producción y vencimiento. |
| 🔄 Movimientos | Registro de entradas, salidas, ajustes y devoluciones. |
| 🏢 Proveedores | Administración de proveedores y datos asociados. |
| 📋 Kardex | Consulta del historial de movimientos y seguimiento de existencias. |
| 📊 Excel | Importación y exportación de información mediante archivos Excel. |
| 🗑️ Papelera | Administración de registros eliminados y recuperación de información. |

## 🧠 3. Gestión inteligente del inventario

El sistema incorpora funcionalidades para mantener la consistencia entre los productos y sus respectivos lotes.

- Asociación de lotes con productos.
- Actualización de existencias según los movimientos registrados.
- Descuento de cantidades desde los lotes correspondientes.
- Seguimiento de fechas de vencimiento.
- Identificación de lotes vigentes, próximos a vencer y vencidos.
- Consulta de movimientos para mantener la trazabilidad.

### Control de vencimientos

| Estado | Descripción |
|---|---|
| 🟢 Vigente | Producto dentro de su periodo de validez. |
| 🟠 Por vencer | Producto próximo a alcanzar su fecha de vencimiento. |
| 🔴 Vencido | Producto que superó su fecha de vencimiento. |
| ⚫ Agotado | Lote sin existencias disponibles. |

## 🔄 4. Control de movimientos

INAMBU WMS permite registrar diferentes operaciones relacionadas con el inventario:

- **Entrada:** incrementa las existencias.
- **Salida:** descuenta unidades del lote correspondiente.
- **Ajuste:** permite regularizar cantidades.
- **Devolución:** registra el retorno de productos.

Los movimientos permiten consultar información relacionada con el producto, lote, cantidad y operación realizada.

## 📊 5. Importación y exportación Excel

El sistema incorpora herramientas para trabajar con archivos Excel y facilitar la gestión de información.

**Importación:**
- Lectura de hojas de cálculo.
- Identificación de encabezados.
- Procesamiento de información de productos y lotes.
- Incorporación de datos al sistema.

**Exportación:**
- Generación de archivos Excel.
- Descarga de información para revisión y respaldo.
- Consulta de datos del inventario fuera de la aplicación.

## 🏗️ 6. Arquitectura del proyecto

El proyecto utiliza una arquitectura basada en tecnologías web para construir una aplicación de escritorio.

| Tecnología | Responsabilidad |
|---|---|
| React | Construcción de la interfaz de usuario. |
| TypeScript | Tipado y organización del código. |
| Vite | Entorno de desarrollo y compilación frontend. |
| Tauri 2 | Integración y empaquetado como aplicación de escritorio. |
| Rust | Base nativa de la aplicación Tauri. |
| Context API | Administración del estado global. |
| IndexedDB | Almacenamiento de información y archivos importados. |
| LocalStorage | Persistencia de información local. |
| SheetJS (XLSX) | Lectura y procesamiento de Excel. |
| Recharts | Visualización de información mediante gráficos. |
| jsPDF | Generación de documentos PDF. |

### Organización general

```text
INAMBU-WMS/
│
├── src/
│   ├── components/       # Componentes reutilizables
│   ├── pages/            # Módulos y pantallas
│   ├── store/            # Estado global y lógica de inventario
│   ├── lib/              # Funciones auxiliares e importación
│   ├── assets/           # Recursos gráficos
│   ├── App.tsx           # Componente principal
│   └── main.tsx          # Punto de entrada
│
├── src-tauri/
│   ├── src/              # Código nativo Rust
│   ├── icons/            # Iconos de la aplicación
│   └── tauri.conf.json   # Configuración de Tauri
│
├── public/               # Recursos públicos
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 💻 7. Instalación y ejecución

### Requisitos

- Node.js.
- pnpm.
- Rust y Cargo.
- Dependencias de compilación necesarias para Tauri en Windows.

### Clonar el repositorio

```bash
git clone https://github.com/andremezabarriga314/Sistema_de_Almacenes.git
cd Sistema_de_Almacenes
```

### Instalar dependencias

```bash
pnpm install
```

### Ejecutar en modo desarrollo

Para iniciar la aplicación de escritorio:

```bash
pnpm tauri dev
```

Para ejecutar solamente el frontend:

```bash
pnpm dev
```

## 📦 8. Generación del instalador

Para compilar la aplicación de escritorio para Windows:

```bash
pnpm tauri build
```

Los instaladores generados se encuentran dentro de:

```text
src-tauri/target/release/bundle/
```

La carpeta puede contener los formatos de distribución configurados para el proyecto, como MSI o instaladores EXE.

## 🔐 9. Consideraciones técnicas

- La aplicación está diseñada para ejecutarse como software de escritorio.
- La información se administra mediante almacenamiento local.
- Los archivos Excel importados se procesan para incorporar información al inventario.
- La consistencia entre productos, lotes y movimientos es fundamental para el control de existencias.
- Se recomienda realizar respaldos periódicos de la información.

## 🎯 10. Objetivo del proyecto

Desarrollar una herramienta tecnológica que facilite la administración de almacenes mediante el control organizado de productos, lotes, proveedores y movimientos, proporcionando información útil para el seguimiento del inventario y la toma de decisiones.

---

<div align="center">

### 👨‍💻 Desarrollado por

**ANDRÉ MEZA BARRIGA**

Estudiante de Ingeniería de Software con Inteligencia Artificial

[GitHub](https://github.com/andremezabarriga314) · [LinkedIn](https://linkedin.com/in/andremezabarriga)

<br/>

**INAMBU WMS — Gestión inteligente de almacenes**

</div>
