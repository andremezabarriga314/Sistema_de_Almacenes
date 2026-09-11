# PROMPT PROFESIONAL: SISTEMA DE GESTIÓN DE ALMACENES

## 1. DESCRIPCIÓN GENERAL DEL PROYECTO

Desarrollar un **Sistema Integral de Gestión de Almacenes** que permita administrar el inventario, movimientos de entrada/salida, seguimiento de proveedores y generación de reportes. El sistema debe ser profesional, intuitivo, seguro y escalable.

---

## 2. MÓDULOS PRINCIPALES REQUERIDOS

### 2.1 DASHBOARD DE RESULTADOS
- **Visualización General del Inventario**
  - Valor total del inventario en tiempo real
  - Stock crítico (productos bajo nivel mínimo)
  - Rotación de inventario
  - Productos con mayor movimiento
  - Productos con menor movimiento
  - Variación de inventario (últimos 30 días)

- **Indicadores Clave (KPIs)**
  - Entradas totales del mes
  - Salidas totales del mes
  - Productos en stock
  - Productos agotados
  - Tasa de rotación promedio
  - Valor promedio de transacción

- **Gráficos Interactivos**
  - Gráfico de barras: Movimientos por categoría
  - Gráfico de líneas: Tendencia de inventario
  - Gráfico de pastel: Distribución por proveedor
  - Gráfico de pastel: Productos por categoría
  - Heatmap: Rotación de inventario

- **Alertas Automáticas**
  - Stock mínimo alcanzado
  - Productos próximos a vencer
  - Movimientos anómalos detectados

---

### 2.2 GESTIÓN DE PRODUCTOS
- **Registro de Productos**
  - Código único (SKU/EAN)
  - Nombre y descripción
  - Categoría
  - Subcategoría
  - Precio costo
  - Precio venta
  - Stock actual
  - Stock mínimo
  - Stock máximo
  - Unidad de medida
  - Fecha de ingreso
  - Foto/Imagen del producto
  - Código de barras (generación automática)
  - Estado (Activo/Inactivo)
  - Ubicación en almacén
  - Lote/Serie
  - Fecha de vencimiento

- **Búsqueda y Filtrado**
  - Búsqueda por código, nombre, categoría
  - Filtros avanzados
  - Búsqueda por rango de precios
  - Búsqueda por estado

---

### 2.3 ENTRADA DE MERCANCÍA
- **Registro de Entradas**
  - Número de comprobante/Orden de compra
  - Fecha de entrada
  - Proveedor
  - Detalles de productos (código, cantidad, precio unitario)
  - Descripción de la entrada
  - Documentos adjuntos (facturas, albaranes)
  - Usuario que registra
  - Observaciones
  - Estado de entrada (Pendiente/Confirmada/Rechazada)

- **Validaciones**
  - Verificar existencia de proveedor
  - Validar códigos de productos
  - Alertas de precios anormales
  - Control de duplicados

- **Ingreso por Lotes**
  - Importar múltiples productos desde Excel/CSV

---

### 2.4 SALIDA DE MERCANCÍA
- **Registro de Salidas**
  - Número de comprobante/Número de venta
  - Fecha de salida
  - Cliente/Destino
  - Detalles de productos (código, cantidad, precio)
  - Motivo de salida (Venta/Devolución/Merma/Robo/Otro)
  - Usuario que registra
  - Autorización requerida
  - Observaciones
  - Documentos adjuntos

- **Validaciones**
  - Verificar disponibilidad de stock
  - Prohibir venta de productos agotados (configurab)
  - Control de movimientos sospechosos
  - Alertas de salidas fuera de horario

- **Autorización**
  - Requerir aprobación para salidas mayores a X cantidad
  - Registro de autorizador

---

### 2.5 KARDEX (REGISTRO DE MOVIMIENTOS)
- **Kardex Completo**
  - Fecha del movimiento
  - Tipo de movimiento (Entrada/Salida/Ajuste/Devolución)
  - Cantidad
  - Precio unitario
  - Saldo resultante
  - Usuario responsable
  - Referencia (Número de comprobante)
  - Método FIFO/LIFO/Promedio ponderado (configurable)

- **Funcionalidades**
  - Visualización por producto
  - Visualización por período (diario/semanal/mensual)
  - Búsqueda de movimientos
  - Filtro por tipo de movimiento
  - Filtro por usuario
  - Auditoría completa de cambios

- **Reportes Kardex**
  - Kardex por producto
  - Kardex por período
  - Kardex por categoría
  - Análisis de variación de costos

---

### 2.6 GESTIÓN DE PROVEEDORES
- **Registro de Proveedores**
  - Nombre/Razón social
  - RUC/NIT/Documento fiscal
  - Contacto (nombre, teléfono, email)
  - Dirección física
  - Dirección fiscal
  - Términos de pago
  - Plazo de entrega
  - Productos suministrados
  - Calificación (1-5 estrellas)
  - Estado (Activo/Inactivo)
  - Observaciones
  - Banco/Datos de pago
  - Documentos (RUC, certificados)

- **Análisis de Proveedores**
  - Historial de compras
  - Monto total de compras
  - Cantidad de transacciones
  - Tiempo promedio de entrega
  - Tasa de devoluciones
  - Evaluación de desempeño
  - Comparativa de precios entre proveedores

---

### 2.7 AJUSTES DE INVENTARIO
- **Ajustes Manuales**
  - Ajuste por merma/pérdida
  - Ajuste por encontrado
  - Ajuste por error de conteo
  - Ajuste por devolución de cliente
  - Ajuste por transferencia entre almacenes

- **Toma Física de Inventario**
  - Crear ciclos de conteo
  - Asignación de responsables
  - Ingreso de cantidades físicas
  - Comparativa física vs. sistema
  - Reporte de diferencias
  - Autorización de ajustes

---

### 2.8 GENERACIÓN DE REPORTES

#### Reportes en PDF y Excel
- **Reportes de Inventario**
  - Inventario actual (listado completo)
  - Productos por vencer (próximos 30/60/90 días)
  - Productos en stock mínimo/máximo
  - Productos sin movimiento
  - Inventario lento
  - Valor total de inventario
  - Productos descontinuados

- **Reportes de Movimientos**
  - Entradas del período
  - Salidas del período
  - Movimientos por producto
  - Movimientos por categoría
  - Movimientos por usuario
  - Movimientos por proveedor
  - Análisis de variación

- **Reportes Financieros**
  - Costo de mercancía vendida (CMVV)
  - Ganancia bruta
  - Rotación de inventario
  - Valor de inventario por categoría
  - Análisis ABC (Pareto)
  - Margen de ganancia por producto

- **Reportes de Proveedores**
  - Historial de compras por proveedor
  - Desempeño de proveedores
  - Comparativa de precios
  - Plazos de entrega
  - Montos de compra

- **Reportes de Auditoría**
  - Log de cambios
  - Movimientos por usuario
  - Transacciones canceladas/anuladas
  - Cambios de precios
  - Acceso al sistema

#### Opciones de Formato
- **PDF**
  - Diseño profesional con logo/membrete
  - Pie y encabezado personalizables
  - Firma digital opcional
  - Código QR con información
  - Gráficos embebidos
  - Tabla de contenidos

- **Excel/CSV**
  - Múltiples hojas por reporte
  - Fórmulas integradas
  - Estilos profesionales
  - Datos sin formato para análisis
  - Compatibilidad con macros
  - Filtros automáticos

---

### 2.9 IMPORTACIÓN DE DATOS

#### IMPORTACIÓN DESDE EXCEL (FUNCIONAMIENTO DETALLADO)

**Paso 1: Carga del Archivo**
- Seleccionar archivo Excel (.xlsx, .xls)
- Validar extensión y tamaño máximo (50MB)
- Cargar archivo en memoria
- Detectar automáticamente número de hojas

**Paso 2: Análisis y Mapeo**
- Lectura de todas las hojas del Excel
- Detección automática de encabezados
- Identificación de tipos de datos (texto, número, fecha)
- Interfaz de mapeo visual (arrastrar columnas)
- Sugerir mapeos basado en nombres de columnas
- Permitir renombrar columnas dinámicamente

**Paso 3: Validación Exhaustiva**
- Validar campos obligatorios no vacíos
- Validar formato de datos:
  - Fechas en formato correcto
  - Números válidos y positivos
  - Códigos de producto existentes/válidos
  - Emails con formato válido
  - Teléfonos con formato
  - Moneda y decimales correctos
- Validar rangos (stock mínimo < stock máximo)
- Detectar duplicados dentro del archivo
- Detectar duplicados contra base de datos
- Validar referencias:
  - Productos existen en sistema
  - Proveedores existen en sistema
  - Categorías válidas
  - Unidades de medida válidas
- Verificar integridad de datos relacionados
- Alertas de datos anómalos:
  - Precios anormalmente altos/bajos
  - Cantidades sospechosas
  - Fechas futuras o muy antiguas

**Paso 4: Vista Previa Detallada (PANTALLA INTERACTIVA)**
- Mostrar tabla con todos los registros
- Código de colores por validación:
  - 🟢 Verde: Válido - listo para importar
  - 🟡 Amarillo: Advertencia - puede continuar
  - 🔴 Rojo: Error - no se puede importar
- Columnas mostradas: todas las del Excel
- Fila por fila mostrando estado
- Columna de "Detalles" expandible con:
  - Mensaje de error específico
  - Valor actual vs. esperado
  - Sugerencia de corrección
- Barra de progreso: X de Y registros válidos
- Contador de:
  - Registros a crear
  - Registros a actualizar (si existe)
  - Registros con error
  - Registros ignorados
- Opción de filtrar por estado (todos/válidos/errores/advertencias)
- Descargar reporte preliminar de validación (Excel o PDF)

**Paso 5: Correción de Errores (INTERACTIVO)**
- Permitir editar directamente en la tabla:
  - Click en celda para editar
  - Validación en tiempo real mientras edita
  - Guardar cambio con Enter
  - Cambio de color a verde si se corrige
- Para campos con opciones, mostrar dropdown
- Cargar archivo CSV auxiliar con correcciones
- Usar datos de referencia para autocompletar
- Revalidar automáticamente después de correcciones

**Paso 6: Selección de Acción**
- Opción 1: Importar NUEVOS
  - Crear solo productos no existentes
  - Ignorar los que ya existen
- Opción 2: Actualizar EXISTENTES
  - Actualizar campos de productos existentes
  - Mantener stock anterior o reemplazar
  - Elegir qué campos actualizar
- Opción 3: Crear + Actualizar
  - Crear nuevos
  - Actualizar existentes
  - Mostrar mapeo de acción por registro

**Paso 7: Confirmación Final**
- Resumen de cambios:
  - Cantidad de registros a crear
  - Cantidad de registros a actualizar
  - Cantidad de registros ignorados
  - Valores totales que se agregarán al inventario
- Impacto estimado:
  - Nuevo valor total de inventario
  - Cambios en stock por categoría
- Botón rojo "IMPORTAR" (requiere confirmación adicional)
- Checkbox obligatorio: "Confirmo que he revisado todos los datos"

**Paso 8: Proceso de Importación**
- Barra de progreso en tiempo real (X de Y)
- Procesamiento con transacción (todo o nada)
- Si hay error: rollback automático
- Mostrar registros procesados actualmente
- Opción de pausar (no recomendado)
- Tiempo estimado restante

**Paso 9: Resultado Detallado**
- ✅ Importación exitosa o ❌ Falló
- Cantidad de registros procesados exitosamente
- Desglose por tipo de acción:
  - X registros creados
  - X registros actualizados
  - X registros ignorados
- Tabla con resultados finales:
  - Código del producto
  - Acción realizada (Creado/Actualizado/Ignorado)
  - Stock anterior vs. Nuevo stock
  - Cambio en valor total
  - Timestamp de operación
- Productos con impacto crítico resaltados
- Log completo de cambios (expandible)
- Opciones finales:
  - 📊 Descargar reporte de importación (PDF/Excel)
  - 🔄 Importar más archivos
  - 📈 Ver impacto en dashboard
  - 🔙 Volver al menú

**Validaciones Adicionales por Tipo:**

*Si importa PRODUCTOS:*
- Código único o permitir duplicados
- SKU formato válido
- Precio costo > 0
- Precio venta >= precio costo
- Stock actual >= 0
- Stock mínimo < Stock máximo
- Imagen opcional o requerida
- Categoría debe existir

*Si importa ENTRADAS:*
- Número de comprobante único
- Fecha no futura
- Proveedor debe existir
- Cantidad > 0
- Precio unitario > 0
- Total debe coincidir con cantidad × precio
- Referencia a orden de compra (si aplica)

*Si importa SALIDAS:*
- Número de comprobante único
- Fecha no futura
- Stock disponible >= cantidad
- Precio no negativo
- Motivo válido (Venta/Devolución/etc)
- Cliente identificado

---

#### IMPORTACIÓN DESDE PDF (FUNCIONAMIENTO DETALLADO)

**Paso 1: Carga y Análisis del PDF**
- Cargar archivo PDF (.pdf)
- Validar PDF válido y legible
- Detectar si es PDF nativo o escaneado (OCR)
- Extracción de estructura:
  - Texto directo si es nativo
  - OCR si es escaneado (Tesseract/EasyOCR)
- Mostrar vista previa de páginas importadas
- Detección automática de tablas
- Extracción de imágenes si aplica

**Paso 2: Reconocimiento Automático de Documento**
- Identificar tipo de documento:
  - Factura/Comprobante
  - Albarán/Guía de remisión
  - Orden de compra
  - Lista de inventario
  - Reporte personalizado
- Detección de campos importantes automáticamente:
  - Número de comprobante (posición típica)
  - Fecha (buscar patrones)
  - Proveedor/Cliente (encabezado)
  - Tabla de detalles (filas y columnas)
  - Totales (pie de página)
- Confianza del reconocimiento (50%-100%)

**Paso 3: Extracción de Datos**
- Extracción de tablas:
  - Detectar automáticamente columnas
  - Separar encabezados de datos
  - Limpiar espacios y caracteres especiales
  - Unir celdas fusionadas correctamente
- Extracción de campos clave:
  - Párrafos que contienen números
  - Fechas en diferentes formatos
  - Datos después de palabras clave
- Manejo de OCR imperfecto:
  - Corrección de palabras comunes
  - Detección de errores de lectura
  - Sugerencia de correcciones
- Extracción de metadata:
  - Número de páginas
  - Fecha de creación del PDF
  - Autor si está disponible

**Paso 4: Mapeo Inteligente**
- Interfaz de mapeo visual:
  - Mostrar datos extraídos en panel izquierdo
  - Campos del sistema a la derecha
  - Arrastrar para mapear o seleccionar con dropdown
- Mapeo automático por similitud:
  - "Cod" → Código de producto
  - "Descripción" → Nombre producto
  - "Qty" / "Cantidad" → Cantidad
  - "Precio Unit." → Precio unitario
  - "Total" → Monto total
- Permitir crear campos adicionales
- Guardar mapeos como plantillas para futuros PDFs del mismo proveedor
- Mostrar confianza del mapeo (%)

**Paso 5: Validación de Datos Extraídos**
- Mismo proceso de validación que Excel
- PERO con énfasis en posibles errores OCR:
  - 0 vs. O, 1 vs. l, S vs. 5
  - Decimales con coma vs. punto
  - Separadores de miles inconsistentes
- Mostrar texto original vs. texto interpretado
- Permitir correcciones manuales fácilmente
- Validación de coherencia:
  - Cantidad × Precio = Total
  - Suma de totales coincide
  - Fechas lógicas
  - Números válidos

**Paso 6: Vista Previa Interactiva**
- Panel dividido:
  - Izquierda: vista previa del PDF (navegable)
  - Centro: datos extraídos (tabla editable)
  - Derecha: panel de validación
- Sincronización:
  - Click en dato extraído → resalta en PDF
  - Editar dato → cambio inmediato en PDF
- Mostrar posición original en PDF
- Detalle de confianza por dato
- Sugerencias de corrección con 1 click

**Paso 7: Corrección y Validación**
- Tabla completamente editable
- Validación en tiempo real:
  - Mientras escribe, valida el campo
  - Muestra error/advertencia inmediatamente
  - Verde cuando es válido
- Cargar referencia de datos (ej: lista de códigos válidos)
- Autocompletar inteligente:
  - Basado en datos históricos
  - Basado en otros campos del PDF
  - Buscar productos por descripción
- Atajos de teclado (Tab, Enter, etc.)
- Deshacer/Rehacer cambios

**Paso 8: Selección de Destino**
- ¿Qué datos extraer del PDF?
  - Importar como entrada de compra
  - Importar como salida/venta
  - Importar como lista de productos
  - Importar como proveedores
  - Importar como ajuste de inventario
- ¿Asociar a qué?
  - Proveedor (si es entrada)
  - Cliente (si es salida)
  - Referencia (número de comprobante)
  - Fecha de operación

**Paso 9: Confirmación y Vista Previa Final**
- Mostrar exactamente qué se importará:
  - Tabla con datos a importar
  - Colores por validación
  - Impacto en inventario
  - Valores que se agregarán/restarán
- Cantidad de registros a procesar
- Checkbox: "Confirmo que los datos son correctos"
- Opción de guardar datos extraídos como JSON/CSV para auditoría

**Paso 10: Importación**
- Transacción atómica (todo o nada)
- Barra de progreso
- Log en tiempo real
- Si falla: mostrar exactamente dónde y por qué
- Rollback automático si hay error

**Paso 11: Resultado y Documentación**
- ✅ Éxito o ❌ Error detallado
- Tabla de resultados:
  - Datos importados
  - Acciones realizadas
  - Impacto en inventario
- Archivo PDF original vinculado:
  - Guardar PDF como documento de referencia
  - Escanear y OCR para búsqueda futura
  - Vincular a movimiento en kardex
  - Disponible para descarga/vista
- Opciones:
  - 📄 Ver PDF original
  - 📊 Descargar reporte (PDF/Excel)
  - 🔗 Ver registro creado en sistema
  - 📸 Tomar captura del resultado
  - 🔄 Importar otro PDF

**Características Especiales para PDF:**

- **Múltiples páginas**
  - Detectar si tabla continúa en siguiente página
  - Combinar datos de múltiples páginas
  - Omitir encabezados/pies repetidos

- **Documento escaneado (OCR)**
  - Mejorar calidad antes de OCR
  - Deskew automático (rotar página)
  - Binarización de imagen
  - Eliminar ruido
  - Mostrar confianza de lectura (%)
  - Permitir corrección manual más fácil

- **Múltiples tablas**
  - Detectar si hay varias tablas
  - Permitir seleccionar cuáles procesar
  - Combinarlas en una sola importación
  - O importar por separado

- **Firma y Validación**
  - Detectar firma digital
  - Mostrar información de sello/firma
  - Marcar documento como auténtico en auditoría

---

#### INTEGRACIÓN PDF + EXCEL + SISTEMA

**Flujo Unificado:**
1. Usuarios pueden subir indistintamente Excel o PDF
2. Sistema automáticamente:
   - Detecta tipo de archivo
   - Aplica proceso correspondiente
   - Extrae/mapea datos
   - Valida según tipo
   - Muestra vista previa unificada
3. Resultado idéntico sin importar origen
4. Ambos documentos guardados como referencia
5. Auditoría registra origen del dato

---

### 2.10 EXPORTACIÓN DE DATOS (FUNCIONAMIENTO DETALLADO)

#### EXPORTACIÓN A EXCEL (PROFESIONAL Y COMPLETA)

**Opciones de Exportación:**

1. **Datos Maestros**
   - Lista completa de productos (todas las columnas)
   - Proveedores con historial
   - Categorías y subcategorías
   - Clientes registrados
   - Ubicaciones de almacén
   - Unidades de medida

2. **Reportes Operativos**
   - Inventario actual (stock real)
   - Entradas del período (filtrable)
   - Salidas del período (filtrable)
   - Movimientos por producto
   - Movimientos por usuario
   - Movimientos por proveedor
   - Kardex completo

3. **Reportes Financieros**
   - Valor total de inventario
   - Costo de mercancía vendida (CMVV)
   - Margen de ganancia
   - Ganancia bruta por categoría
   - Rotación de inventario
   - Análisis ABC
   - Rentabilidad por producto

4. **Reportes Gerenciales**
   - Desempeño de proveedores
   - Productos de lento movimiento
   - Productos sin movimiento (X días)
   - Productos próximos a vencer
   - Stock mínimo/máximo
   - Comparativa períodos anteriores
   - Variación de precios

**Estructura del Excel Exportado:**

```
Archivo: Reporte_Inventario_2024-01-15.xlsx

Hoja 1: RESUMEN
  - Portada profesional
  - Fecha de generación
  - Período cubierto
  - Datos del almacén
  - KPIs principales
  - Tabla de contenidos
  - Firma digital QR

Hoja 2: DATOS
  - Datos principales del reporte
  - Formato profesional con:
    * Encabezados congelados
    * Ancho automático de columnas
    * Bordes y sombreado
    * Formato de números (decimales, moneda)
    * Formato de fechas
    * Alineación óptima
  - Filtros automáticos en cada columna
  - Ordenamiento predeterminado
  - Totales en fila inferior

Hoja 3: ANÁLISIS
  - Tablas dinámicas (si aplica)
  - Gráficos incrustados
  - Estadísticas descriptivas
  - Percentiles
  - Promedios y desviaciones

Hoja 4: DETALLES (si aplica)
  - Información adicional
  - Líneas de auditoría
  - Transacciones componentes
  - Desglose por categoría

Hoja 5: DATOS_BRUTOS
  - Datos sin formato para análisis
  - CSV compatible
  - Todos los campos
  - Sin fórmulas
```

**Características Avanzadas:**

- **Fórmulas integradas:**
  - Subtotales automáticos
  - Totales generales
  - Cálculos de promedio
  - Margen de ganancia (fórmula)
  - Rotación (fórmula)
  - Permitir que usuarios hagan cálculos propios

- **Validación de datos:**
  - Listas desplegables en columnas editables
  - Rangos válidos
  - Formatos restringidos
  - Permitir al usuario ingresar datos válidos

- **Protección:**
  - Celdas bloqueadas (lectura)
  - Celdas editables (solo datos)
  - Hoja protegida (sin modificar estructura)
  - Opción de cifrado con contraseña

- **Estilos profesionales:**
  - Paleta de colores corporativos
  - Fuentes legibles
  - Espaciado apropiado
  - Logo de empresa en portada
  - Número de página
  - Pie de página con fecha

- **Rendimiento:**
  - Importación rápida
  - Sin macros innecesarios
  - Compatible con versiones antiguas
  - Tamaño optimizado

**Proceso de Exportación a Excel:**

1. Usuario selecciona "Exportar a Excel"
2. Aparece diálogo con opciones:
   - Tipo de reporte (dropdown)
   - Período (desde/hasta)
   - Filtros adicionales
   - Incluir gráficos (sí/no)
   - Incluir fórmulas (sí/no)
   - Proteger hoja (sí/no)
3. Vista previa:
   - Mostrar primeras filas
   - Mostrar estructura de hojas
   - Tamaño estimado
4. Descargar con nombre:
   - Formato: Reporte_[Tipo]_[YYYY-MM-DD]_[HH-MM].xlsx
   - Timestamp para auditoría
5. Opción de compartir:
   - Enviar por email
   - Guardar en nube
   - Programar enviío periódico

---

#### EXPORTACIÓN A PDF (PROFESIONAL Y FORMALES)

**Tipos de Reportes PDF:**

1. **Reportes Operativos**
   - Inventario actual
   - Entradas/Salidas del período
   - Kardex por producto
   - Movimientos del día

2. **Reportes Financieros**
   - Valuación de inventario
   - CMVV
   - Rentabilidad
   - Comparativas

3. **Reportes Formales**
   - Reportes para auditoría
   - Reportes para dirección
   - Reportes para terceros
   - Certificados

**Estructura del PDF:**

```
Portada:
  - Logo empresa (grande, centrado)
  - Nombre del reporte
  - Período cubierto
  - Fecha de generación
  - Número de reporte único
  - Código QR (vincula a datos)

Tabla de Contenidos:
  - Secciones principales
  - Número de páginas
  - Actualizados automáticamente

Resumen Ejecutivo:
  - KPIs principales
  - Cambios importantes
  - Alertas
  - Análisis breve de hallazgos

Cuerpo Principal:
  - Tablas con datos
  - Gráficos profesionales
  - Párrafos explicativos
  - Paginación automática
  - Ruptura de página inteligente
  - Tablas con:
    * Encabezados repetidos en cada página
    * Totales en pie
    * Sombreado alternado para legibilidad
    * Bordes profesionales

Gráficos:
  - Gráficos de barras (comparativas)
  - Gráficos de líneas (tendencias)
  - Gráficos de pastel (distribuciones)
  - Gráficos de dispersión (correlaciones)
  - Todos con:
    * Títulos y leyendas
    * Ejes etiquetados
    * Colores corporativos
    * Resolución alta

Apéndices:
  - Metodología
  - Definiciones
  - Fuentes de datos
  - Fecha de corte

Pie de Página:
  - Número de página (ej: "5 de 12")
  - Fecha de generación
  - Hora
  - Nombre de usuario que generó
  - Logo empresa (pequeño)

Contraportada:
  - Información de contacto
  - Avisos legales
  - Confidencialidad
  - Firma digital
```

**Características Profesionales:**

- **Firma Digital:**
  - Certificado digital de autenticidad
  - Firma electrónica del gerente
  - Timestamp de generación
  - Validable por terceros

- **Código QR:**
  - Enlace a datos vivos en sistema
  - Verificación rápida
  - Seguimiento de acceso
  - Metadata incrustado

- **Marca de agua:**
  - "CONFIDENCIAL" (configurable)
  - Aparece en cada página
  - No interfiere lectura
  - Indica estado

- **Numeración:**
  - Número único de reporte
  - Consecutivo
  - Registrado en auditoría
  - Imposible duplicar

- **Metadatos:**
  - Título documento
  - Autor (usuario del sistema)
  - Tema
  - Palabras clave
  - Fecha creación
  - Versión
  - Derechos de autor

- **Seguridad:**
  - Encriptación (contraseña opcional)
  - Restricción de impresión
  - Restricción de copia
  - Restricción de edición
  - Marca temporal certificada

- **Compresión:**
  - Imágenes comprimidas automáticamente
  - Mantener calidad visual
  - Tamaño final razonable
  - Descarga rápida

**Proceso de Exportación a PDF:**

1. Usuario selecciona "Exportar a PDF"
2. Diálogo de configuración:
   - Tipo de reporte
   - Período
   - Filtros
   - Incluir gráficos
   - Firma digital (sí/no)
   - Encriptación (sí/no)
   - Restricciones (sí/no)
3. Vista previa:
   - Primera página
   - Cantidad de páginas
   - Tamaño estimado
   - Posibles problemas de paginación
4. Opciones finales:
   - Incluir código QR
   - Marca de agua
   - Nivel de compresión
5. Descargar:
   - Nombre: Reporte_[Tipo]_[YYYY-MM-DD]_[HH-MM].pdf
   - Abrir en navegador o descargar
   - Opción de enviar por email
   - Opción de guardar en nube

---

#### EXPORTACIÓN SIMULTÁNEA (PDF + EXCEL)

- Un clic para descargar ambos formatos
- Nombres consistentes
- Mismos datos, diferente formato
- Útil para distribución

---

#### EXPORTACIÓN PROGRAMADA (AUTOMATIZADA)

**Configuración:**
- Seleccionar reportes a generar
- Frecuencia:
  - Diario (a hora específica)
  - Semanal (día y hora)
  - Mensual (día del mes)
  - Personalizado (cada X días)
- Destinatarios:
  - Email a enviados
  - Múltiples destinatarios
  - Copia a gerente
- Formatos (Excel/PDF/Ambos)
- Período de datos (últimos 30 días, mes actual, etc.)

**Ejecución:**
- Sistema ejecuta automáticamente
- Genera reporte sin usuario
- Envía por email con asunto profesional
- Cuerpo del email resumen
- Adjunta archivo(s)
- Log de envío en sistema
- Reintentos si falla
- Notificación si error

**Historial:**
- Ver todos los reportes generados
- Descargar reportes antiguos
- Ver detalles de envío
- Estadísticas de acceso
- Rastrear cambios en tiempo

---

#### EXPORTACIÓN A OTROS FORMATOS

**CSV (para análisis)**
- Delimitado por comas o punto y coma
- Codificación UTF-8
- Encabezados incluidos
- Sin formato
- Importable en cualquier herramienta

**JSON (para sistemas)**
- Estructura jerárquica
- Metadata completo
- Relaciones preservadas
- API-ready

**XML (para integración)**
- Esquema definido
- Validable
- Para importar en otros sistemas
- Mantiene estructura

**SQL (backup)**
- Sentencias INSERT
- Restaurable en base de datos
- Backup funcional

---

### 2.11 ELIMINACIÓN DE DATOS (SEGURIDAD ROBUSTA)

#### ELIMINACIÓN INTELIGENTE Y SEGURA

**Política General:**
- Nunca borrar datos que afecten auditoría
- Nunca borrar datos que tengan relaciones
- Nunca borrar registros de movimientos
- Solo marcar como inactivo/eliminado lógicamente
- Hard delete solo en casos excepcionales

**Tipos de Eliminación:**

1. **SOFT DELETE (Eliminación Lógica) - POR DEFECTO**
   
   ¿Qué es?
   - No borra realmente de la base de datos
   - Marca registro con fecha_eliminacion y usuario_eliminacion
   - Oculto del usuario normal
   - Recuperable siempre
   - Auditable completamente
   
   Aplicable a:
   - Productos (si no tienen movimientos)
   - Proveedores (si no tienen histórico)
   - Usuarios
   - Clientes
   - Categorías (si están vacías)
   
   No aplicable a:
   - Movimientos de inventario
   - Facturas/Comprobantes
   - Asientos contables
   - Logs de auditoría

2. **INACTIVACIÓN (Estado Inactivo)**
   
   Alternativa a eliminar:
   - Cambiar estado a "Inactivo"
   - Sigue existiendo en sistema
   - No aparece en listas normales
   - Se puede reactivar con 1 clic
   - Mejor que eliminar
   
   Aplica a:
   - Productos discontinuados
   - Proveedores que no compran más
   - Usuarios desactivados
   - Categorías no usadas

3. **HARD DELETE (Eliminación Física) - EXCEPCIONAL**
   
   Cuándo permitir:
   - Datos duplicados (antes de importar)
   - Datos erróneos sin relaciones
   - Datos de prueba
   - SOLO con múltiples confirmaciones
   
   Nunca permitir:
   - Si hay movimientos de inventario
   - Si aparece en reportes históricos
   - Si tiene facturas asociadas
   - Si está en período de auditoría

---

#### FLUJO DE ELIMINACIÓN DETALLADO

**Paso 1: Seleccionar Registro a Eliminar**
- Click en botón "Eliminar" (rojo, con icono de basura)
- Sistema verifica si se puede eliminar
- Si no se puede: muestra razón clara con sugerencias

**Paso 2: Análisis de Impacto**

Sistema automáticamente:
- Detecta relaciones:
  - Movimientos asociados
  - Facturas vinculadas
  - Transacciones relacionadas
  - Reportes que incluyen dato
- Calcula impacto:
  - Registros que se verán afectados
  - Datos que se quedarían huérfanos
  - Pérdida de histórico
  - Impacto en auditoría

**Paso 3: Pantalla de Confirmación (MODAL)**

```
┌─────────────────────────────────────┐
│ ⚠️ CONFIRMAR ELIMINACIÓN           │
├─────────────────────────────────────┤
│                                     │
│ Está a punto de eliminar:           │
│ Producto: SKU-001 "Laptop Dell"     │
│                                     │
│ ⚠️ ADVERTENCIA:                     │
│ - Este producto tiene 15 movimientos│
│ - Última entrada: 2024-01-10        │
│ - Stock actual: 5 unidades          │
│ - Valor en inventario: $2,500       │
│                                     │
│ ❌ NO SE PUEDE ELIMINAR             │
│ Razón: Tiene movimientos activos    │
│                                     │
│ Alternativas recomendadas:          │
│ ✓ Marcar como INACTIVO              │
│ ✓ Reducir stock a cero              │
│ ✓ Crear entrada de ajuste           │
│                                     │
│ [Marcar Inactivo] [Cancelar]       │
└─────────────────────────────────────┘
```

Si SÍ se puede eliminar:

```
┌─────────────────────────────────────┐
│ 🗑️ ELIMINAR REGISTRO               │
├─────────────────────────────────────┤
│                                     │
│ Registro a eliminar:                │
│ Documento: DOC-12345                │
│ Tipo: Entrada                       │
│ Fecha: 2024-01-15                   │
│                                     │
│ ✓ SEGURO ELIMINAR                   │
│ - Sin relaciones criticas           │
│ - Tipo: Soft Delete (recuperable)   │
│ - Se guardará en papelera           │
│                                     │
│ MOTIVO DE ELIMINACIÓN (obligatorio):│
│ [ Duplicado / Error / Otro ▼ ]      │
│ [_____________________________]     │
│                                     │
│ Observaciones adicionales:          │
│ [_____________________________]     │
│                                     │
│ □ Entiendo que esto es permanente   │
│                                     │
│ [ELIMINAR] [CANCELAR]              │
└─────────────────────────────────────┘
```

**Paso 4: Validación de Permisos**
- ¿Usuario tiene permiso de eliminar?
- Si no: bloquear y notificar
- Si sí: solicitar confirmación adicional

**Paso 5: Confirmación Final (2FA)**
- Si es datos críticos:
  - Enviar código a email del usuario
  - Usuario debe ingresar código
  - Código válido solo 5 minutos
  - Máximo 3 intentos

**Paso 6: Backup Automático**
- Antes de eliminar:
  - Crear snapshot de datos
  - Guardar en backup seguro
  - Encriptar backup
  - Timestamp preciso

**Paso 7: Eliminación**
- Ejecutar operación
- Transacción atómica
- Rollback si hay error
- Registrar en auditoría:
  - Usuario que eliminó
  - Fecha/hora exacta
  - IP de origen
  - Razón
  - Datos eliminados (antes)
  - Confirmación de backup

**Paso 8: Confirmación**
- ✅ "Eliminado exitosamente"
- Mensaje con opciones:
  - Ver papelera para recuperar
  - Volver a listado
  - Eliminar otro

---

#### PAPELERA DE RECICLAJE (RECUPERACIÓN)

**Ubicación:**
- Menú principal → Herramientas → Papelera
- O desde registro eliminado

**Vista de Papelera:**
- Tabla con registros eliminados:
  - Tipo de registro
  - Información principal
  - Fecha de eliminación
  - Usuario que eliminó
  - Motivo de eliminación
  - Estado (recuperable/no recuperable)

**Filtros:**
- Por tipo de registro
- Por fecha
- Por usuario
- Por motivo
- Por estado

**Acciones:**
- 🔄 Recuperar (restore completo)
- 👁️ Ver detalles
- 📋 Ver auditoría
- 🔄 Ver antes/después
- ❌ Eliminar permanentemente (hard delete)

**Recuperación:**
- 1 clic para restaurar
- Solicitud de confirmación
- Registro de recuperación en auditoría
- Notificar a usuario original
- Volver a estado anterior (activo/inactivo)

**Período de Gracia:**
- Datos recuperables: 90 días
- Después: eliminación definitiva automática
- Notificación 7 días antes
- Backup se mantiene 1 año

---

#### ELIMINACIÓN MASIVA (CONTROLADA)

**Para eliminar múltiples registros:**
- Seleccionar registros (checkbox)
- Click "Eliminar seleccionados"
- Análisis de impacto completo
- Resumen:
  - X registros a eliminar
  - Impacto total
  - Advertencias generales
- Confirmación por uno:
  - Mostrar cada registro
  - Permitir des-seleccionar
- O confirmación grupal:
  - Motivo general
  - Procesar todos

**Validación:**
- Si alguno no se puede eliminar:
  - Mostrar cuáles sí y cuáles no
  - Explicar por qué
  - Permitir eliminar solo los válidos
  - Generar reporte

---

#### ELIMINACIÓN POR PERÍODO

**Automática según políticas:**
- Datos de prueba > 30 días: eliminar automáticamente
- Registros de sesión > 1 año: archivar
- Logs > 7 años: archivar (cumplimiento legal)
- Papelera > 90 días: eliminar

**Configuración:**
- Admin puede ajustar períodos
- Notificación antes de eliminar automático
- Posibilidad de parar proceso
- Log de lo que se eliminó

---

#### AUDITORÍA COMPLETA DE ELIMINACIÓN

Cada eliminación registra:
- ID del registro eliminado
- Tipo de registro
- Datos completos (antes)
- Usuario que eliminó
- Timestamp exacto (microsegundos)
- IP origen
- Dispositivo/navegador
- Razón especificada
- Método (soft/hard)
- Backup ubicación
- Confirmaciones realizadas
- Tiempo de permanencia en papelera
- Si fue recuperado o definitivamente eliminado

Todo recuperable para auditoría externa

---

## 2.12 INTEGRACIÓN TOTAL DEL SISTEMA (TODO FUNCIONA JUNTO)

### PRINCIPIO FUNDAMENTAL
**CONSISTENCIA TOTAL**: Cualquier cambio en un módulo se refleja automáticamente en todos los demás sin retraso.

### FLUJOS INTEGRADOS

#### FLUJO 1: ENTRADA COMPLETA

```
Usuario registra entrada de mercancía
        ↓
Sistema valida automáticamente:
  - Proveedor existe ✓
  - Productos existen ✓
  - Cantidades válidas ✓
  - Precios lógicos ✓
        ↓
Stock se actualiza en tiempo real
        ↓
Kardex se actualiza automáticamente
  - Método FIFO/LIFO aplicado
  - Costo unitario calculado
  - Saldo resultante ajustado
        ↓
Dashboard se actualiza inmediatamente
  - Cantidad de productos aumenta
  - Valor total sube
  - KPIs recalculados
  - Gráficos refrescan
        ↓
Alertas automáticas:
  - ¿Alcanzó stock máximo? → Notificación
  - ¿Producto nunca visto? → Alert
  - ¿Precio anormal? → Warning
        ↓
Auditoría registra:
  - Quién, cuándo, dónde
  - Antes/después
  - Datos completos
        ↓
Email al gerente (si está configurado):
  - Entrada grande registrada
  - Valor ingresado
  - Variación de precio
```

#### FLUJO 2: VENTA COMPLETA

```
Usuario registra salida de mercancía
        ↓
Sistema verifica:
  - Stock disponible ✓
  - Producto activo ✓
  - Cantidad válida ✓
  - Permiso para vender ✓
  - Autorización (si aplica) ✓
        ↓
Si stock insuficiente:
  → Bloquea operación
  → Muestra disponible
  → Sugiere alternativas
        ↓
Si todo válido:
  Stock se descuenta en tiempo real
        ↓
Kardex se actualiza:
  - Salida registrada
  - Costo PROMEDIO ponderado
  - Stock resultante
  - Método consistente
        ↓
Dashboard actualiza al instante:
  - Stock disminuye
  - Valor total baja
  - Rotación se calcula
  - Margen se ajusta
        ↓
Alertas automáticas:
  - ¿Stock bajo? → Alert
  - ¿Producto próximo a vencer? → Warning
  - ¿Venta inusual? → Notification
        ↓
Reportes se actualizan:
  - CMVV recalculado
  - Rentabilidad ajustada
  - Análisis ABC refrescado
        ↓
Auditoría registra operación completa
        ↓
Cliente (si existe) se actualiza:
  - Historial de compras
  - Total gastado
  - Frecuencia de compra
```

#### FLUJO 3: IMPORTACIÓN DE EXCEL

```
Usuario carga archivo Excel
        ↓
Sistema analiza archivo:
  - Detecta estructura
  - Identifica columnas
  - Mapea a campos del sistema
        ↓
Validación exhaustiva:
  - Datos obligatorios
  - Formatos correctos
  - Referencias válidas
  - Duplicados detectados
  - Rangos válidos
        ↓
Vista previa interactiva:
  - Muestra todos los datos
  - Código de colores por estado
  - Editable en línea
  - Validación en tiempo real
        ↓
Usuario revisa y corrige:
  - Edita errores directamente
  - Revalida automáticamente
  - Confirma acción a tomar
        ↓
Importación ejecuta:
  - Transacción atómica
  - Todo o nada
  - Rollback si error
        ↓
Todos los sistemas se actualizan:
  - Productos ↓
  - Stock ↓
  - Kardex ↓
  - Proveedores ↓
  - Dashboard ↓
  - Reportes ↓
  - Auditoría ↓
        ↓
Reporte detallado:
  - Resumen de cambios
  - Registros creados/actualizados
  - Impacto en inventario
  - Descargar en PDF/Excel
```

#### FLUJO 4: IMPORTACIÓN DE PDF

```
Usuario sube archivo PDF (factura, albarán, etc)
        ↓
Sistema analiza:
  - OCR si es escaneado
  - Extrae tabla
  - Reconoce documento
        ↓
Mapeo automático:
  - Proveedor → búsqueda
  - Productos → búsqueda
  - Cantidades → validación
  - Precios → verificación
        ↓
Vista previa interactiva:
  - PDF en un lado
  - Datos extraídos otro lado
  - Sincronización total
  - Editable directamente
        ↓
Usuario verifica:
  - Datos correctos
  - Mapeo correcto
  - Cantidad correcta
        ↓
Importación integrada:
  - Crea entrada de compra
  - Vincula PDF original
  - Actualiza stock
  - Actualiza kardex
  - Actualiza dashboard
        ↓
Sistema de referencias:
  - PDF guardado
  - Linked a movimiento
  - Recuperable siempre
  - En auditoría
```

#### FLUJO 5: EXPORTACIÓN (CUALQUIER FORMATO)

```
Usuario solicita exportación
        ↓
Sistema recolecta datos en tiempo real:
  - Stock actual (no caché)
  - Movimientos del período
  - Cálculos actualizados
  - Sin inconsistencias
        ↓
Genera documento profesional:
  - Excel o PDF (idénticos)
  - Formatos correctos
  - Fórmulas funcionales (Excel)
  - Diseño profesional
        ↓
Incluye auditoría:
  - Marca de agua
  - Timestamp
  - Usuario que generó
  - Fecha/hora precisos
        ↓
Opciones de salida:
  - Descargar
  - Email
  - Nube
  - Programado
        ↓
Registro permanente:
  - Historial de exportaciones
  - Quién, cuándo, qué
  - Recuperable siempre
  - Auditable
```

#### FLUJO 6: AJUSTE DE INVENTARIO

```
Usuario realiza toma física
        ↓
Registra diferencia:
  - Sistema dice: X unidades
  - Conté: Y unidades
  - Diferencia: X-Y
        ↓
Sistema crea ajuste:
  - Tipo: Merma/Encontrado/Error
  - Motivo especificado
  - Usuario registra
  - Autorización requerida
        ↓
Kardex se actualiza:
  - Nueva entrada de ajuste
  - Stock resultante correcto
  - Costo ajustado
  - Línea de auditoría
        ↓
Todos los módulos actualizan:
  - Producto ↓
  - Dashboard ↓
  - Valor inventario ↓
  - Reportes ↓
        ↓
Análisis automático:
  - Si diferencia grande → Alert
  - Si frecuente → Warning a jefe
  - Reporte de mermas
  - Tendencias
```

#### FLUJO 7: ANÁLISIS Y REPORTERÍA

```
Usuario solicita reporte
        ↓
Sistema accede a datos vivos:
  - NO caché
  - NO datos estáticos
  - Última información
        ↓
Calcula métricas en tiempo real:
  - Rotación: suma movimientos / stock promedio
  - Margen: (precio venta - costo) / precio venta
  - CMVV: saldo inicial + entradas - saldo final
  - Análisis ABC: 80/20
        ↓
Genera gráficos dinámicos:
  - Interactivos
  - Colores correctos
  - Datos precisos
  - Filtros funcionan
        ↓
Crea documento:
  - Estructura correcta
  - Paginación automática
  - Tablas en cada página
  - Totales correctos
        ↓
Opciones de salida:
  - PDF para imprimir/compartir
  - Excel para análisis
  - Programado automático
        ↓
Registra generación:
  - Auditoría
  - Historial
  - Acceso de usuario
```

### SINCRONIZACIÓN EN TIEMPO REAL

**Principio:** Si un dato cambia en cualquier parte, TODOS los lugares que lo usan se actualizan automáticamente

```
Dashboard actualiza cada:
  - 5 segundos (si hay cambios)
  - Sin recargar página
  - Sin esperar a usuario

Kardex se actualiza:
  - INMEDIATAMENTE tras movimiento
  - Cálculos recalculados
  - Métodos reaplicados

Reportes recalculan:
  - Automáticamente tras cambio
  - Cache invalida
  - Próxima lectura = datos vivos

Stock se refleja:
  - Mismo segundo que se ingresa
  - Verificación disponible
  - Alertas disparan
```

### VALIDACIÓN EN CASCADA

Cuando se registra un movimiento:

```
Nivel 1: Validación de entrada
  ✓ Campos obligatorios llenos
  ✓ Formatos correctos
  ✓ Tipos de datos válidos

Nivel 2: Validación de lógica de negocio
  ✓ Stock disponible (si es salida)
  ✓ Proveedor existe (si es entrada)
  ✓ Producto existe y está activo
  ✓ Autorización si necesita

Nivel 3: Validación de coherencia
  ✓ Cantidad × Precio = Total
  ✓ Rango de precios lógico
  ✓ Cantidades positivas
  ✓ Fechas coherentes

Nivel 4: Validación de integridad
  ✓ No existe movimiento duplicado
  ✓ No viola restricciones de almacén
  ✓ No viola límites de usuario
  ✓ No hay conflictos de permisos

Nivel 5: Validación post-operación
  ✓ Stock resultante correcto
  ✓ Kardex se actualizó
  ✓ Auditoría se registró
  ✓ Dashboard se refrescó
```

### INTEGRIDAD DE DATOS

**Garantías:**
- Nunca hay inconsistencia entre módulos
- Movimientos nunca se pierden
- Auditoría completa siempre
- Recuperación de errores automática
- Backup automático ante cambios críticos

**Mecanismos:**
- Transacciones ACID en base de datos
- Rollback automático si falla
- Validación antes de persistir
- Replicación de datos críticos
- Backup incremental automático
- Verificación de integridad periódica

### MANEJO PERFECTO DE ERRORES

Si algo falla:

```
1. Usuario ve error claro:
   "Proveedor no encontrado. Cree uno primero"
   O "Stock insuficiente. Disponible: 5, solicitado: 10"

2. Sugerencias automáticas:
   "¿Desea crear proveedor nuevo?"
   "¿Desea registrar entrada?"
   "¿Desea ajustar cantidades?"

3. Recuperación automática:
   - Si es error temporal, reintentar
   - Si es error de usuario, bloquear con mensaje
   - Si es error del sistema, loguear y notificar

4. Auditoría del error:
   - Registra intento fallido
   - Razón del fallo
   - Qué datos se intentó
   - Quién lo intentó
   - Cuándo

5. Notificación:
   - Usuario ve en pantalla
   - Log en sistema
   - Email a admin si es crítico
```

### PERFORMANCE OPTIMIZADO

Sistema mantiene velocidad incluso con:
- Millones de movimientos históricos
- Grandes importaciones
- Reportes complejos
- Múltiples usuarios simultáneos

**Técnicas:**
- Índices de base de datos óptimos
- Cache de consultas frecuentes
- Paginación en listados
- Carga asincrónica
- Queries optimizadas
- Archivado de datos antiguos

**Garantías:**
- Carga de dashboard: < 2 segundos
- Búsqueda: < 500ms
- Movimiento: registrado en < 1 segundo
- Reporte: generado en < 10 segundos
- Importación Excel 1000 registros: < 30 segundos

---

## 3. CARACTERÍSTICAS TÉCNICAS

### 3.1 SEGURIDAD Y ACCESO
- Sistema de roles y permisos
  - Administrador
  - Gerente de almacén
  - Operario de entrada
  - Operario de salida
  - Auditor
  - Consulta (solo lectura)

- Autenticación
  - Login con usuario/contraseña
  - 2FA (autenticación de dos factores)
  - Recuperación de contraseña
  - Sesiones activas

- Auditoría
  - Log de todas las acciones
  - Registro de cambios
  - IP y dispositivo de acceso
  - Horario de acceso

### 3.2 BASE DE DATOS
- Normalización de datos
- Índices de rendimiento
- Backups automáticos
- Versionamiento de datos
- Integridad referencial

### 3.3 RENDIMIENTO
- Caché de consultas frecuentes
- Paginación en listados
- Carga asincrónica
- Optimización de consultas
- CDN para archivos

### 3.4 COMPATIBILIDAD
- Navegadores: Chrome, Firefox, Safari, Edge
- Responsive: Desktop, Tablet, Mobile
- Formatos: PDF, Excel, CSV
- Integraciones: APIs externas (ERP, contabilidad)

---

## 4. INTERFAZ DE USUARIO

### 4.1 NAVEGACIÓN
- Menú lateral colapsable
- Breadcrumb de ubicación actual
- Búsqueda global
- Acceso rápido a favoritos

### 4.2 ELEMENTOS VISUALES
- Tablas interactivas con ordenamiento y filtros
- Gráficos dinámicos e interactivos
- Modales para formularios
- Alertas visuales para stock bajo
- Código de colores por estado

### 4.3 FORMULARIOS
- Validación en tiempo real
- Autocomplete en campos de búsqueda
- Campos obligatorios resaltados
- Mensajes de error/éxito claros
- Cancelación de operaciones

---

## 5. INTEGRACIONES OPCIONALES

- API REST para sistemas externos
- Integración con sistemas de contabilidad
- Integración con pasarelas de pago
- API de envíos/logística
- Código de barras/QR
- RFID (opcional)
- Webhooks para notificaciones

---

## 6. CONSIDERACIONES IMPORTANTES

### 6.1 CUMPLIMIENTO NORMATIVO
- Ajustarse a normas locales de facturación
- Retención de logs por período legal
- Protección de datos personales (GDPR-like)
- Comprobantes auditables

### 6.2 ESCALABILIDAD
- Diseño modular
- Capacidad para múltiples usuarios simultáneos
- Crecimiento de volumen de datos
- Multi-almacén (futuro)
- Multi-moneda (futuro)

### 6.3 DOCUMENTACIÓN
- Manual de usuario
- Guía de administrador
- Especificaciones técnicas
- Tutoriales en video
- FAQ

---

## 7. TESTING Y ASEGURAMIENTO DE CALIDAD

### PRUEBAS FUNCIONALES EXHAUSTIVAS

#### PRUEBAS DE PRODUCTOS
- [ ] Crear producto con todos los datos
- [ ] Crear producto sin foto
- [ ] Crear producto con código duplicado → Error
- [ ] Actualizar precio de producto
- [ ] Actualizar stock manualmente
- [ ] Marcar producto como inactivo
- [ ] Búsqueda por código
- [ ] Búsqueda por nombre
- [ ] Búsqueda por categoría
- [ ] Filtros avanzados combinados
- [ ] Generar código de barras
- [ ] Importar productos desde Excel
- [ ] Exportar productos a Excel/PDF

#### PRUEBAS DE ENTRADAS
- [ ] Registrar entrada normal
- [ ] Registrar entrada sin proveedor → Error
- [ ] Registrar entrada con producto inexistente → Error
- [ ] Registrar entrada con cantidad negativa → Error
- [ ] Registrar entrada con precio $0 → Error
- [ ] Registrar entrada con precio muy alto → Warning
- [ ] Stock se actualiza correctamente
- [ ] Kardex registra movimiento
- [ ] Alerta de stock máximo si aplica
- [ ] Importar entradas desde PDF
- [ ] Importar múltiples entradas desde Excel
- [ ] Editar entrada registrada
- [ ] Anular entrada
- [ ] Ver historial de cambios

#### PRUEBAS DE SALIDAS
- [ ] Registrar salida normal
- [ ] Intentar venta sin stock → Bloqueo
- [ ] Venta con stock justo
- [ ] Venta de producto inactivo → Bloqueo
- [ ] Salida genera alerta de stock bajo
- [ ] Kardex registra salida
- [ ] Precio se ajusta correctamente
- [ ] Margen de ganancia se calcula
- [ ] Requiere autorización si es grande
- [ ] Editar salida
- [ ] Anular salida
- [ ] Devolución de cliente registra bien

#### PRUEBAS DE KARDEX
- [ ] Método FIFO funciona correctamente
- [ ] Método LIFO funciona correctamente
- [ ] Método Promedio Ponderado funciona
- [ ] Saldo resultante siempre correcto
- [ ] Costo unitario se calcula bien
- [ ] Kardex por producto es completo
- [ ] Kardex por período muestra bien
- [ ] Búsqueda en kardex funciona
- [ ] Exportación de kardex sin errores

#### PRUEBAS DE IMPORTACIÓN EXCEL
- [ ] Importar archivo Excel válido
- [ ] Mapeo de columnas funciona
- [ ] Validación detecta errores
- [ ] Vista previa muestra correctamente
- [ ] Edición en vista previa funciona
- [ ] Revalidación automática
- [ ] Importación crea registros
- [ ] Stock se actualiza
- [ ] Kardex se registra
- [ ] Reporte de importación
- [ ] Importación grande (1000 registros)
- [ ] Archivo Excel corrupto → Error claro
- [ ] Archivo Excel vacío → Error claro
- [ ] Archivo Excel con muchas hojas

#### PRUEBAS DE IMPORTACIÓN PDF
- [ ] Importar PDF nativo (factura)
- [ ] Importar PDF escaneado (OCR)
- [ ] Extracción de datos correcta
- [ ] Mapeo automático inteligente
- [ ] Vista previa con sincronización
- [ ] Edición en vista previa
- [ ] PDF de múltiples páginas
- [ ] PDF rotado
- [ ] PDF de mala calidad
- [ ] PDF con tabla
- [ ] Reconocimiento de tipo de documento
- [ ] Almacenamiento de PDF original
- [ ] PDF corrupto → Error claro

#### PRUEBAS DE EXPORTACIÓN EXCEL
- [ ] Exportar reporte a Excel
- [ ] Excel abre en Excel Online
- [ ] Excel abre en Calc
- [ ] Fórmulas funcionales
- [ ] Gráficos incrustados
- [ ] Filtros automáticos funcionan
- [ ] Datos sin error
- [ ] Formato profesional
- [ ] Protección de hoja funciona
- [ ] Cifrado de archivo (contraseña)
- [ ] Tamaño de archivo razonable
- [ ] Múltiples hojas bien nombradas
- [ ] Archivo descargable
- [ ] Exportación grande (10K registros)

#### PRUEBAS DE EXPORTACIÓN PDF
- [ ] Exportar reporte a PDF
- [ ] PDF abre en lectores
- [ ] Diseño profesional
- [ ] Tablas legibles
- [ ] Gráficos visibles
- [ ] Código QR funciona
- [ ] Firma digital valida
- [ ] Marca de agua aparece
- [ ] Paginación correcta
- [ ] Compresión buena
- [ ] Metadatos correctos
- [ ] Encriptación funciona
- [ ] Archivo descargable
- [ ] Tamaño razonable

#### PRUEBAS DE DASHBOARD
- [ ] KPIs muestran datos correctos
- [ ] Dashboard actualiza en tiempo real
- [ ] Gráficos son interactivos
- [ ] Filtros funcionan
- [ ] Alertas se muestran
- [ ] Tabla de productos rápida
- [ ] Búsqueda en dashboard rápida
- [ ] Responsive en móvil
- [ ] Responsivo en tablet
- [ ] Responsivo en desktop
- [ ] Botones clickeables
- [ ] Tooltips útiles

#### PRUEBAS DE ELIMACIÓN
- [ ] Producto sin movimientos se puede eliminar
- [ ] Producto con movimientos no se puede eliminar → Error claro
- [ ] Soft delete marca como eliminado
- [ ] Eliminado no aparece en listas
- [ ] Papelera muestra eliminados
- [ ] Recuperación funciona
- [ ] Hard delete requiere confirmación
- [ ] Auditoría registra eliminación
- [ ] Backup se crea antes de eliminar
- [ ] Período de gracia funciona
- [ ] Notificaciones de eliminación próxima

#### PRUEBAS DE PROVEEDORES
- [ ] Crear proveedor
- [ ] Actualizar datos proveedor
- [ ] Historial de compras completo
- [ ] Cálculos de desempeño correctos
- [ ] Análisis ABC por proveedor
- [ ] Comparativa de precios

#### PRUEBAS DE AUDITORÍA
- [ ] Cada acción se registra
- [ ] Log muestra quién/cuándo/qué
- [ ] Cambios antes/después visibles
- [ ] IP registrada
- [ ] Dispositivo registrado
- [ ] Filtros en auditoría funcionan
- [ ] Exportación de auditoría
- [ ] Imposible modificar logs
- [ ] Período de retención correcto

#### PRUEBAS DE SEGURIDAD
- [ ] Login funciona
- [ ] 2FA funciona
- [ ] Roles restrictivos
- [ ] Administrador ve todo
- [ ] Operario solo ve su almacén
- [ ] Auditor solo consulta
- [ ] Permisos se respetan
- [ ] Sesión expira
- [ ] Logout funciona
- [ ] CSRF protegido
- [ ] SQL Injection imposible
- [ ] XSS imposible
- [ ] Datos sensibles encriptados

### PRUEBAS DE RENDIMIENTO

- [ ] Dashboard carga < 2 segundos
- [ ] Búsqueda responde < 500ms
- [ ] Movimiento se registra < 1 segundo
- [ ] Importación 1000 registros < 30 segundos
- [ ] Reporte genera < 10 segundos
- [ ] Kardex completo carga rápido
- [ ] 100 usuarios simultáneos sin lag
- [ ] Base de datos indexada correctamente
- [ ] Queries optimizadas
- [ ] Cache funciona
- [ ] Paginación apropiada

### PRUEBAS DE INTEGRACIÓN

- [ ] Entrada → Stock → Kardex → Dashboard (todos consistentes)
- [ ] Salida → Stock → Kardex → Margen (todos correctos)
- [ ] Importación → Stock → Reportes → Auditoría (flujo completo)
- [ ] Exportación → Archivo descargable sin errores
- [ ] Eliminación → Papelera → Recuperación (ciclo completo)
- [ ] Múltiples usuarios simultáneos sin conflictos
- [ ] Cambio de precio propaga a todos lados
- [ ] Actualización de proveedor refleja en reportes

### PRUEBAS DE DATOS

- [ ] Base de datos íntegra
- [ ] Sin datos huérfanos
- [ ] Sin referencias rotas
- [ ] Sin duplicados no intencionales
- [ ] Contadores correctos
- [ ] Secuencias sin brechas
- [ ] Fechas lógicas
- [ ] Monedas consistentes

---

## 8. CRITERIOS DE ACEPTACIÓN FINAL

### FUNCIONALIDAD CORE
✅ Crear, leer, actualizar y eliminar productos (sin errores)
✅ Registrar entradas con validación completa
✅ Registrar salidas con validación de stock
✅ Kardex funciona 100% con método FIFO/LIFO/Promedio
✅ Stock siempre consistente en todo el sistema
✅ Todas las transacciones registradas en auditoría
✅ Datos nunca pierden integridad

### IMPORTACIÓN EXCEL
✅ Cargar archivo Excel válido
✅ Mapeo automático y manual de columnas
✅ Validación exhaustiva con vista previa
✅ Edición interactiva de errores
✅ Importación atómica (todo o nada)
✅ Reporte detallado de resultados
✅ Stock se actualiza correctamente
✅ Kardex registra movimiento
✅ Sin corrupción de datos

### IMPORTACIÓN PDF
✅ Extraer datos de PDF nativo
✅ OCR en PDF escaneado
✅ Mapeo automático de campos
✅ Vista previa sincronizada
✅ Edición de datos extraídos
✅ Validación antes de importar
✅ PDF original vinculado y guardado
✅ Stock actualizado correctamente
✅ Sin pérdida de datos

### EXPORTACIÓN EXCEL
✅ Generar reportes en Excel profesional
✅ Múltiples hojas estructuradas
✅ Fórmulas funcionales
✅ Gráficos incrustados
✅ Filtros automáticos
✅ Protección de hoja
✅ Cifrado con contraseña
✅ Datos precisos y completos
✅ Archivo descargable correctamente

### EXPORTACIÓN PDF
✅ Generar reportes en PDF profesional
✅ Diseño corporativo
✅ Tablas legibles
✅ Gráficos visibles
✅ Código QR funcional
✅ Firma digital valida
✅ Compresión eficiente
✅ Encriptación opcional
✅ Archivo descargable correctamente

### DASHBOARD
✅ KPIs actualizados en tiempo real
✅ Gráficos interactivos
✅ Alertas visuales
✅ Búsqueda rápida
✅ Filtros funcionales
✅ Responsive (móvil/tablet/desktop)
✅ Performance < 2 segundos

### KARDEX
✅ Registro completo de movimientos
✅ Métodos de valuación correctos
✅ Saldo resultante preciso
✅ Búsqueda y filtros
✅ Exportable en cualquier formato
✅ Auditoría impecable

### SEGURIDAD Y AUDITORÍA
✅ Roles y permisos restrictivos
✅ 2FA funcionando
✅ Log de cada acción
✅ Imposible modificar históricos
✅ Cumplimiento normativo
✅ Backup automático
✅ Recuperación funcional

### ELIMINACIÓN SEGURA
✅ Soft delete (recuperable)
✅ Hard delete (con confirmaciones)
✅ Papelera de reciclaje
✅ Período de gracia
✅ Auditoría completa
✅ Backup automático
✅ Restricciones inteligentes

### RENDIMIENTO
✅ Dashboard < 2 segundos
✅ Búsqueda < 500ms
✅ Movimiento < 1 segundo
✅ Múltiples usuarios sin lag
✅ Base de datos optimizada
✅ Caché funcional

### INTERFAZ
✅ Intuitiva y clara
✅ Responsiva en todos los dispositivos
✅ Mensajes de error útiles
✅ Validación clara
✅ Navegación lógica
✅ Accesibilidad (WCAG)

### INTEGRIDAD DE DATOS
✅ Consistencia entre módulos (entrada/stock/kardex/dashboard)
✅ Números siempre coinciden
✅ Auditoría completa e íntegra
✅ Ningún dato se pierde
✅ Recuperación de errores automática
✅ Transacciones ACID

---

## 9. CASOS DE USO PRINCIPALES

### Caso 1: Ingreso de Mercancía
1. Gerente recibe orden de compra
2. Operario registra entrada con detalles
3. Sistema actualiza stock automáticamente
4. Kardex registra movimiento
5. Dashboard se actualiza

### Caso 2: Venta de Producto
1. Operario escanea código de producto
2. Sistema verifica disponibilidad
3. Se registra la salida
4. Stock se decrementa
5. Alerta si stock es bajo
6. Kardex registra movimiento

### Caso 3: Generación de Reportes
1. Usuario selecciona tipo de reporte
2. Elige período y filtros
3. Visualiza vista previa
4. Descarga en formato deseado
5. Recibe correo con reporte

### Caso 4: Auditoría
1. Auditor accede a logs del sistema
2. Filtra por fecha, usuario o tipo de acción
3. Visualiza cambios históricos
4. Genera reporte de auditoría
5. Detecta inconsistencias

---

## 10. TECNOLOGÍAS RECOMENDADAS

### Backend
- Node.js, Django, Laravel, Java Spring Boot, ASP.NET Core

### Frontend
- React, Vue, Angular

### Base de Datos
- PostgreSQL, MySQL, SQL Server

### Hosting
- AWS, Google Cloud, Azure, DigitalOcean

### Librerías Recomendadas
- PDF: PDFKit, iText, ReportLab
- Excel: ExcelJS, openpyxl, XlsxWriter
- Gráficos: Chart.js, D3.js, Plotly
- Código de barras: JsBarcode, Barcode4j

---

## 11. ESTIMACIÓN DE TIEMPO (REFERENCIA)

- **Fase 1** (2-3 semanas): Módulos básicos (productos, entradas, salidas)
- **Fase 2** (2 semanas): Kardex y reportes
- **Fase 3** (1-2 semanas): Importación/Exportación
- **Fase 4** (1 semana): Seguridad y auditoría
- **Fase 5** (1 semana): Testing y ajustes

**Total**: 7-9 semanas para versión MVP

---

## 12. ESPECIFICACIONES DE FUNCIONAMIENTO PERFECTO

### PRINCIPIOS NO NEGOCIABLES

1. **CONSISTENCIA TOTAL**
   - Stock en producto = Stock en dashboard = Stock en reporte
   - Nunca diferencias entre módulos
   - Actualización inmediata (< 1 segundo)
   - Sincronización automática siempre

2. **VALIDACIÓN EXHAUSTIVA**
   - NUNCA permitir dato inválido
   - NUNCA permitir transacción sin auditoría
   - NUNCA permitir stock negativo
   - NUNCA permitir operación sin autorización requerida

3. **RECUPERACIÓN SEGURA**
   - TODO debe ser recuperable
   - TODO debe estar auditado
   - TODO debe tener backup
   - TODO debe poder revertirse (excepto auditoría)

4. **INTEGRIDAD ABSOLUTA**
   - Transacciones ACID
   - Rollback automático si error
   - Ningún dato se pierde
   - Base de datos siempre íntegra

5. **TRANSPARENCIA TOTAL**
   - Usuario siempre ve qué pasa
   - Errores claros y específicos
   - Sugerencias útiles automáticas
   - Auditoría completa de todo

### GARANTÍAS DE FUNCIONAMIENTO

**GARANTÍA 1: ENTRADAS PERFECTAS**
```
✓ Usuario registra entrada
✓ Sistema valida TODOS los datos
✓ Stock se actualiza AL INSTANTE
✓ Kardex registra movimiento CORRECTAMENTE
✓ Dashboard refleja cambio INMEDIATAMENTE
✓ Auditoría registra operación COMPLETA
✓ Proveedor muestra histórico ACTUALIZADO
```
Resultado: PERFECTA CONSISTENCIA

**GARANTÍA 2: SALIDAS PERFECTAS**
```
✓ Usuario intenta vender
✓ Sistema verifica stock DISPONIBLE
✓ Si hay stock: permite transacción
✓ Si no hay: bloquea CON MENSAJE CLARO
✓ Stock se descuenta AL INSTANTE
✓ Kardex registra con método CORRECTO
✓ Margen se calcula PRECISAMENTE
✓ Dashboard actualiza INMEDIATAMENTE
```
Resultado: PROTECCIÓN TOTAL DE INVENTARIO

**GARANTÍA 3: IMPORTACIÓN PERFECTA**
```
✓ Usuario carga Excel o PDF
✓ Sistema analiza COMPLETAMENTE
✓ Valida TODOS los datos
✓ Muestra vista previa EXACTA
✓ Usuario revisa y corrige
✓ Revalidación automática
✓ Importación ATÓMICA (todo o nada)
✓ TODOS los módulos se actualizan
✓ Reporte detallado PRECISAMENTE
✓ Auditoria COMPLETA de todo
```
Resultado: CERO ERRORES EN IMPORTACIÓN

**GARANTÍA 4: EXPORTACIÓN PERFECTA**
```
✓ Usuario solicita exportación
✓ Sistema recolecta datos EN VIVO
✓ NO usa caché
✓ Calcula métricas PRECISAS
✓ Genera documento PROFESIONAL
✓ Formato PERFECTO
✓ Gráficos CORRECTOS
✓ Archivos DESCARGABLES
✓ Auditoría REGISTRADA
```
Resultado: REPORTES DE CONFIANZA

**GARANTÍA 5: KARDEX PERFECTO**
```
✓ Cada movimiento registrado
✓ Método de valuación CONSISTENTE
✓ Saldo SIEMPRE correcto
✓ Costo PRECISAMENTE calculado
✓ Historial COMPLETO e íntegro
✓ NUNCA inconsistencias
✓ SIEMPRE auditable
```
Resultado: HISTÓRICO IMPECABLE

**GARANTÍA 6: DASHBOARD VIVO**
```
✓ KPIs ACTUALIZADOS EN TIEMPO REAL
✓ Cambios se ven AL INSTANTE
✓ Gráficos INTERACTIVOS
✓ Alertas AUTOMÁTICAS
✓ Sin retraso NUNCA
✓ Performance EXCELENTE
✓ Responsive PERFECTO
```
Resultado: INFORMACIÓN VIVA Y CONFIABLE

**GARANTÍA 7: ELIMINACIÓN SEGURA**
```
✓ Soft delete por defecto
✓ Recuperable SIEMPRE (90 días)
✓ Auditoría COMPLETA
✓ Backup AUTOMÁTICO
✓ Hard delete IMPOSIBLE sin confirmación
✓ Papelera FUNCIONAL
✓ Restricciones INTELIGENTES
```
Resultado: NINGÚN DATO SE PIERDE

### CHECKLIST DE FUNCIONAMIENTO PERFECTO

Antes de considerarse "listo", el sistema debe pasar:

**A. Flujo Entrada**
- [ ] Registra entrada sin errores
- [ ] Stock se actualiza al instante
- [ ] Kardex registra movimiento
- [ ] Dashboard refleja cambio
- [ ] Auditoría completa
- [ ] Alerta si aplica
- [ ] Proveedor actualiza historial

**B. Flujo Salida**
- [ ] Verifica stock disponible
- [ ] Bloquea si no hay stock
- [ ] Registra salida si hay stock
- [ ] Stock se descuenta al instante
- [ ] Kardex registra con método correcto
- [ ] Margen se calcula
- [ ] Dashboard actualiza
- [ ] Auditoría completa

**C. Flujo Importación Excel**
- [ ] Carga archivo
- [ ] Mapea columnas
- [ ] Valida todos los datos
- [ ] Vista previa exacta
- [ ] Usuario puede editar
- [ ] Revalidación automática
- [ ] Importación ejecuta sin error
- [ ] Todos los módulos se actualizan
- [ ] Reporte generado
- [ ] Auditoría registrada

**D. Flujo Importación PDF**
- [ ] Carga archivo
- [ ] Extrae datos (OCR si aplica)
- [ ] Mapeo automático
- [ ] Vista previa sincronizada
- [ ] Usuario puede editar
- [ ] Validación completa
- [ ] Importación sin error
- [ ] PDF vinculado y guardado
- [ ] Todos los módulos actualizados
- [ ] Reporte generado

**E. Flujo Exportación Excel**
- [ ] Selecciona reporte
- [ ] Recolecta datos en vivo
- [ ] Genera Excel profesional
- [ ] Múltiples hojas bien estructuradas
- [ ] Fórmulas funcionales
- [ ] Gráficos incrustados
- [ ] Archivo descargable
- [ ] Auditoría registrada

**F. Flujo Exportación PDF**
- [ ] Selecciona reporte
- [ ] Recolecta datos en vivo
- [ ] Genera PDF profesional
- [ ] Tablas legibles
- [ ] Gráficos visibles
- [ ] Diseño corporativo
- [ ] Archivo descargable
- [ ] Auditoría registrada

**G. Flujo Eliminación**
- [ ] Usuario intenta eliminar
- [ ] Sistema valida restricciones
- [ ] Muestra si se puede/no se puede
- [ ] Si se puede: pide confirmación
- [ ] Soft delete por defecto
- [ ] Papelera disponible
- [ ] Recuperación funciona
- [ ] Auditoría completa

**H. Flujo Kardex**
- [ ] Movimiento se registra
- [ ] Método se aplica correctamente
- [ ] Saldo es preciso
- [ ] Costo es correcto
- [ ] Búsqueda funciona
- [ ] Filtros funcionan
- [ ] Exportación funciona
- [ ] Auditoría íntegra

**I. Sincronización Total**
- [ ] Cambio en producto → dashboard actualiza
- [ ] Entrada de stock → kardex se actualiza
- [ ] Cambio de precio → margen se recalcula
- [ ] Actualización de proveedor → reportes reflejan
- [ ] Eliminación → papelera disponible
- [ ] TODO se actualiza AL INSTANTE

**J. Performance**
- [ ] Dashboard carga < 2 segundos
- [ ] Búsqueda responde < 500ms
- [ ] Movimiento registra < 1 segundo
- [ ] Importación 1000 registros < 30 segundos
- [ ] Reporte genera < 10 segundos
- [ ] 100 usuarios simultáneos sin lag

### PUNTOS CRÍTICOS DE VERIFICACIÓN

Revisar estos puntos obligatoriamente:

```
□ Stock nunca negativo
□ Kardex siempre consistente
□ Auditoría nunca vacía
□ Dashboard siempre vivo
□ Importación siempre válida
□ Exportación siempre correcta
□ Eliminación siempre recuperable
□ Roles siempre respetados
□ Base de datos siempre íntegra
□ Errores siempre claros
□ Performance siempre bueno
□ Sincronización siempre perfecta
```

---

**Versión del Documento**: 2.0 (COMPLETO Y DETALLADO)
**Fecha**: 2024
**Autor**: Equipo de Especificaciones Profesionales
**Estado**: Listo para desarrollo
**Garantía**: Funcionamiento perfecto sin excepciones