 <div align="center">

<img src="assets/inambu-banner.svg" width="100%" alt="INAMBU WMS"/>

<br/>

![React](https://img.shields.io/badge/REACT-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TYPESCRIPT-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/VITE-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tauri](https://img.shields.io/badge/TAURI-2-FFC131?style=for-the-badge&logo=tauri&logoColor=black)
![Rust](https://img.shields.io/badge/RUST-000000?style=for-the-badge&logo=rust&logoColor=white)

### SISTEMA DE GESTIÓN Y CONTROL DE ALMACÉN

*Tecnología, organización y trazabilidad para una gestión eficiente del inventario.*

[FUNCIONALIDADES](#-módulos-del-sistema) · [TECNOLOGÍAS](#-tecnologías) · [INSTALACIÓN](#-instalación)

</div>

---

## 🔷 01 — PRESENTACIÓN DEL PROYECTO

**INAMBU WMS** es una aplicación de escritorio desarrollada para gestionar y controlar las operaciones de almacén.

Su propósito es centralizar la información de productos, lotes, proveedores y movimientos de inventario, permitiendo realizar un seguimiento organizado de las existencias y conservar la trazabilidad de las operaciones.

<details>
<summary><strong>🎯 Objetivos del sistema</strong></summary>

- Organizar la información de los productos.
- Controlar las existencias mediante lotes.
- Registrar entradas, salidas y otros movimientos.
- Supervisar fechas de producción y vencimiento.
- Consultar el historial de operaciones.
- Facilitar el intercambio de información mediante Excel.

</details>

---

## ⚡ 02 — MÓDULOS DEL SISTEMA

<table>
<tr>
<td width="50%" valign="top">

### <img src="https://img.shields.io/badge/01-PRODUCTOS-0EA5E9?style=flat-square" />

**Gestión de productos**

Administración del catálogo de productos, códigos, presentaciones y datos relacionados con el inventario.

</td>
<td width="50%" valign="top">

### <img src="https://img.shields.io/badge/02-LOTES-8B5CF6?style=flat-square" />

**Control de lotes**

Registro de cantidades, números de lote, fechas de ingreso, producción y vencimiento.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### <img src="https://img.shields.io/badge/03-MOVIMIENTOS-10B981?style=flat-square" />

**Operaciones de inventario**

Registro de entradas, salidas, ajustes y devoluciones, manteniendo el seguimiento de las existencias.

</td>
<td width="50%" valign="top">

### <img src="https://img.shields.io/badge/04-PROVEEDORES-F59E0B?style=flat-square" />

**Gestión de proveedores**

Administración de información de proveedores y asociación con los registros de inventario.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### <img src="https://img.shields.io/badge/05-KARDEX-06B6D4?style=flat-square" />

**Historial de movimientos**

Consulta de operaciones y seguimiento de las variaciones de existencias.

</td>
<td width="50%" valign="top">

### <img src="https://img.shields.io/badge/06-EXCEL-16A34A?style=flat-square" />

**Importación y exportación**

Procesamiento de hojas de cálculo para incorporar y consultar información.

</td>
</tr>
<tr>
<td colspan="2">

### <img src="https://img.shields.io/badge/07-PAPELERA-64748B?style=flat-square" />

**Administración de registros eliminados**

Gestión de registros enviados a la papelera y opciones de recuperación disponibles.

</td>
</tr>
</table>

---

## 🧠 03 — CONTROL INTELIGENTE DE INVENTARIO

El sistema relaciona los productos con sus lotes para facilitar el seguimiento de cantidades y movimientos.

| Indicador | Descripción |
|:---|:---|
| 🟢 **VIGENTE** | Lote dentro de su periodo de validez. |
| 🟠 **POR VENCER** | Lote próximo a su fecha de vencimiento. |
| 🔴 **VENCIDO** | Lote cuya fecha de vencimiento ha sido superada. |
| ⚫ **AGOTADO** | Lote sin existencias disponibles. |

### Flujo de operaciones

```mermaid
flowchart TD
    A["📥 Registro o importación"] --> B["📦 Productos"]
    B --> C["🏷️ Lotes"]
    C --> D["📊 Existencias"]
    D --> E["🔄 Movimientos"]
    E --> F["📋 Kardex"]
    F --> G["📤 Consulta y exportación"]

    style A fill:#075985,color:#fff,stroke:#22d3ee
    style B fill:#1e3a8a,color:#fff,stroke:#60a5fa
    style C fill:#4c1d95,color:#fff,stroke:#a78bfa
    style D fill:#164e63,color:#fff,stroke:#22d3ee
    style E fill:#065f46,color:#fff,stroke:#34d399
    style F fill:#713f12,color:#fff,stroke:#fbbf24
    style G fill:#312e81,color:#fff,stroke:#818cf8
```

---

## 🏗️ 04 — ARQUITECTURA DEL SOFTWARE

La aplicación está organizada en capas que separan la interfaz, la lógica de negocio y el almacenamiento local.

```mermaid
flowchart TB
    subgraph FRONT["CAPA DE PRESENTACIÓN"]
        A["React"]
        B["TypeScript"]
        C["Componentes y páginas"]
    end

    subgraph BUSINESS["CAPA DE APLICACIÓN"]
        D["Context API"]
        E["Lógica de inventario"]
        F["Procesamiento Excel"]
    end

    subgraph PERSISTENCE["CAPA DE DATOS"]
        G["LocalStorage"]
        H["IndexedDB"]
    end

    subgraph NATIVE["CAPA DE ESCRITORIO"]
        I["Tauri 2"]
        J["Rust"]
    end

    A --> B --> C
    C --> D
    D --> E
    D --> F
    D --> G
    D --> H
    C --> I --> J

    style FRONT fill:#0c2944,stroke:#0ea5e9,color:#fff
    style BUSINESS fill:#211b48,stroke:#8b5cf6,color:#fff
    style PERSISTENCE fill:#123b35,stroke:#10b981,color:#fff
    style NATIVE fill:#3b2a12,stroke:#f59e0b,color:#fff
```

### Organización de tecnologías

| Tecnología | Responsabilidad |
|---|---|
| React 19 | Construcción de la interfaz. |
| TypeScript | Tipado y organización del código. |
| Vite | Desarrollo y compilación frontend. |
| Tauri 2 | Integración como aplicación de escritorio. |
| Rust | Capa nativa de Tauri. |
| Context API | Administración del estado global. |
| LocalStorage | Persistencia local. |
| IndexedDB | Almacenamiento local de archivos y datos. |
| SheetJS (XLSX) | Lectura y procesamiento de Excel. |
| Recharts | Visualización de datos. |
| jsPDF | Generación de documentos PDF. |

---

## 📁 05 — ESTRUCTURA DEL PROYECTO

```text
INAMBU-WMS/
│
├── assets/
│   └── inambu-banner.svg
│
├── src/
│   ├── components/       # Componentes reutilizables
│   ├── pages/            # Módulos y pantallas
│   ├── store/            # Estado y lógica de aplicación
│   ├── lib/              # Funciones auxiliares
│   ├── assets/           # Recursos gráficos
│   ├── App.tsx
│   └── main.tsx
│
├── src-tauri/
│   ├── src/              # Código nativo Rust
│   ├── icons/            # Iconos de escritorio
│   └── tauri.conf.json
│
├── public/
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

<sub>La estructura es referencial y puede variar según la organización actual del código fuente.</sub>

---

## 💻 06 — INSTALACIÓN

### Requisitos previos

| Herramienta | Función |
|---|---|
| Node.js | Entorno de ejecución. |
| pnpm | Gestor de paquetes. |
| Rust | Desarrollo nativo. |
| Cargo | Gestión de dependencias Rust. |

### 01. Clonar el repositorio

```bash
git clone https://github.com/andremezabarriga314/Sistema_de_Almacenes.git

cd Sistema_de_Almacenes
```

### 02. Instalar dependencias

```bash
pnpm install
```

### 03. Ejecutar frontend

```bash
pnpm dev
```

### 04. Ejecutar aplicación de escritorio

```bash
pnpm tauri dev
```

---

## 📦 07 — COMPILACIÓN PARA WINDOWS

Para generar la aplicación de escritorio:

```bash
pnpm tauri build
```

Los instaladores se generan en:

```text
src-tauri/target/release/bundle/
```

Los formatos disponibles dependen de la configuración de compilación de Tauri.

---

## 🔐 08 — CONSIDERACIONES TÉCNICAS

- Aplicación orientada a escritorio.
- Almacenamiento de información local.
- Procesamiento de archivos Excel.
- Gestión de relaciones entre productos, lotes y movimientos.
- Se recomienda realizar copias de seguridad periódicas.

---

## 👨‍💻 09 — DESARROLLADOR

<div align="center">

### ANDRÉ MEZA BARRIGA

**Ingeniería de Software con Inteligencia Artificial**

[![GitHub](https://img.shields.io/badge/GITHUB-andremezabarriga314-181717?style=for-the-badge&logo=github)](https://github.com/andremezabarriga314)

[![LinkedIn](https://img.shields.io/badge/LINKEDIN-Perfil-0A66C2?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/andremezabarriga)

<br/>

**INAMBU WMS**

*Gestión inteligente. Control preciso. Trazabilidad.*

</div>