# Proyecto Campus Parking - Gestión de Parqueaderos con MongoDB

## 1. Introducción al Proyecto

Este proyecto implementa una solución de base de datos NoSQL utilizando MongoDB para la empresa "Campus Parking", que administra múltiples parqueaderos. El objetivo es migrar de hojas de cálculo locales a una base de datos centralizada y robusta que permita un registro unificado, acceso eficiente a la información, reportes analíticos, control de seguridad basado en roles y consistencia de datos a través de transacciones.

La solución aborda la gestión de vehículos, usuarios (administradores, empleados de sede, clientes), sedes y zonas de parqueo, así como el control de ingresos y salidas de vehículos con cálculo de costos y tiempos.

---

## 2. Justificación del uso de MongoDB

Se eligió MongoDB por las siguientes razones:

* **Flexibilidad del Esquema (Schema-less):** Campus Parking maneja diversos tipos de vehículos y zonas con configuraciones variables (tarifas, tipos permitidos). MongoDB permite almacenar documentos con estructuras flexibles, lo que facilita la adaptación a nuevos tipos de vehículos o a la evolución de las necesidades de las sedes sin un impacto drástico en el esquema preexistente. Aunque usamos `$jsonSchema` para añadir un nivel de validación, la naturaleza orientada a documentos sigue ofreciendo gran agilidad.
* **Escalabilidad Horizontal:** A medida que Campus Parking crezca y añada más sedes y usuarios, MongoDB puede escalar horizontalmente mediante sharding, distribuyendo los datos a través de múltiples servidores para manejar grandes volúmenes de datos y tráfico.
* **Modelo de Datos Intuitivo:** La representación de datos en formato JSON (BSON en MongoDB) se alinea bien con el modelo de objetos que usarían las aplicaciones backend (ej. JavaScript/Node.js, Python), lo que simplifica el desarrollo y reduce la necesidad de mapeo objeto-relacional.
* **Alto Rendimiento:** MongoDB está diseñado para un alto rendimiento, especialmente para operaciones de lectura y escritura intensivas, lo cual es crucial para un sistema de parqueo con constantes registros de entrada y salida.
* **Capacidades Analíticas (Framework de Agregación):** Permite realizar consultas analíticas complejas y generar reportes directamente desde la base de datos, lo cual es fundamental para el análisis de ocupación, ingresos y uso del parqueadero.
* **Soporte para Transacciones:** A partir de MongoDB 4.0, se implementaron transacciones multi-documento con propiedades ACID (Atomicidad, Consistencia, Aislamiento, Durabilidad), garantizando la integridad de datos en operaciones críticas como el registro de ingresos que afectan múltiples colecciones (ej. actualizar cupos y registrar parqueo).

---

## 3. Diseño del Modelo de Datos

El modelo de datos está compuesto por las siguientes colecciones, utilizando un enfoque híbrido entre embebidos y referencias, según la cardinalidad y la frecuencia de acceso a los datos.

### Colecciones Creadas:

* **`usuarios`**: Almacena información de Administradores, Empleados y Clientes.
* **`vehiculos`**: Contiene los detalles de los vehículos registrados, con referencia al cliente propietario.
* **`sedes`**: Guarda la información de cada parqueadero (ciudad, dirección, etc.).
* **`zonas`**: Detalles de las zonas dentro de cada sede (capacidad, tarifas, tipos de vehículo permitidos), con referencia a la sede a la que pertenecen.
* **`parqueos`**: Registra cada evento de ingreso y salida de un vehículo, con referencias a vehículo, sede y zona.

### Decisiones de Uso de Referencias o Embebidos:

* **Referencias (1-a-Muchos):** Se optó por referencias para las relaciones principales (ej. `parqueos` a `vehiculos`, `sedes`, `zonas`; `vehiculos` a `usuarios`; `zonas` a `sedes`). Esto es ideal cuando los documentos relacionados son grandes, se actualizan independientemente o se accede a ellos con frecuencia por sí solos. Por ejemplo, un vehículo puede tener muchos parqueos, y una sede muchas zonas, pero los detalles de la sede/zona no se repiten en cada parqueo. Las agregaciones con `$lookup` facilitan la unión de estos datos para los reportes.
* **Campos Embebidos:**
    * **`tarifas` en `zonas`**: Las tarifas por tipo de vehículo están embebidas como un subdocumento en la colección `zonas` porque son específicas de cada zona y rara vez se acceden de forma independiente de la zona. Esto optimiza las lecturas para obtener toda la información de una zona.
    * **`intereses` en `usuarios` (ejemplo no implementado pero posible):** Si un usuario tuviera una lista de intereses, sería un array embebido.

### Validaciones `$jsonSchema`

Cada colección tiene un esquema de validación `$jsonSchema` definido en `db_config.js`. Esto garantiza la integridad y el formato correcto de los datos en el momento de la inserción o actualización.

**Explicación de validaciones por colección:**

* **`usuarios`**:
    * `tipo_usuario`: Enum (`Administrador`, `Empleado`, `Cliente`) para asegurar roles válidos.
    * `email`: Formato de email con `pattern`.
    * `cedula`: Único (`unique: true`) para evitar duplicados en la identificación personal.
    * Campos requeridos (`required`): `tipo_usuario`, `nombre`, `apellido`, `email`, `password`.
* **`vehiculos`**:
    * `placa`: Único (`unique: true`).
    * `tipo_vehiculo`: Enum (`carro`, `moto`, `bicicleta`, `camioneta`).
    * Campos requeridos: `placa`, `tipo_vehiculo`, `marca`, `modelo`, `id_propietario`.
* **`sedes`**:
    * `nombre`: Único para identificar cada sede.
    * Campos requeridos: `nombre`, `ciudad`, `direccion`, `telefono`.
* **`zonas`**:
    * `nombre_zona` + `id_sede`: Índice compuesto único para que no haya zonas con el mismo nombre dentro de la misma sede.
    * `capacidad_maxima`, `cupos_disponibles`: `bsonType: 'int'` y `minimum: 0`.
    * `tarifas`: Objeto donde las propiedades son dinámicas (tipos de vehículo) pero los valores deben ser `double` y `>= 0`. **Estos valores representan Pesos Colombianos (COP).**
    * `tipos_vehiculo_permitidos`: Array de strings con `enum` (`carro`, `moto`, `bicicleta`, `camioneta`) y `minItems: 1`.
    * Campos requeridos: `nombre_zona`, `id_sede`, `capacidad_maxima`, `cupos_disponibles`, `tarifas`, `tipos_vehiculo_permitidos`.
* **`parqueos`**:
    * `hora_entrada`, `hora_salida`: Tipo `date`. `hora_salida` es `null` si el parqueo está activo.
    * `costo_total`, `tiempo_total_minutos`: Puede ser `null` si el parqueo está activo. `minimum: 0`. **El `costo_total` se expresa en Pesos Colombianos (COP).**
    * `estado`: Enum (`activo`, `finalizado`).
    * Campos requeridos: `id_vehiculo`, `id_sede`, `id_zona`, `hora_entrada`, `estado`.

### Índices

Los índices se crearon para optimizar las consultas más frecuentes y asegurar la unicidad de ciertos campos.

**Lista de índices creados y justificación técnica:**

* **`usuarios`**:
    * `{ email: 1 }`, `unique: true`: Para búsquedas rápidas y autenticación por email, asegurando unicidad.
    * `{ cedula: 1 }`, `unique: true`, `sparse: true`: Para búsquedas rápidas por cédula (solo para usuarios que la tengan), asegurando unicidad. `sparse` para permitir documentos sin el campo `cedula`.
    * `{ tipo_usuario: 1, id_sede_asignada: 1 }`: Optimiza la búsqueda de empleados por tipo y sede.
* **`vehiculos`**:
    * `{ placa: 1 }`, `unique: true`: Búsqueda rápida por placa, fundamental para el registro de parqueo.
    * `{ id_propietario: 1 }`: Optimiza la búsqueda de vehículos por propietario (cliente).
    * `{ tipo_vehiculo: 1 }`: Útil para reportes y filtros por tipo de vehículo.
* **`sedes`**:
    * `{ nombre: 1 }`, `unique: true`: Búsqueda rápida por nombre de sede.
    * `{ ciudad: 1 }`: Para consultas que agrupan o filtran por ciudad.
* **`zonas`**:
    * `{ id_sede: 1, nombre_zona: 1 }`, `unique: true`: Asegura que no haya nombres de zona duplicados dentro de la misma sede y optimiza la búsqueda de una zona específica en una sede.
    * `{ id_sede: 1, cupos_disponibles: -1 }`: Para encontrar zonas con cupos rápidamente en una sede determinada, ordenadas por disponibilidad.
* **`parqueos`**:
    * `{ id_vehiculo: 1 }`: Para buscar el historial de parqueos de un vehículo específico.
    * `{ id_sede: 1, id_zona: 1, estado: 1 }`: Para encontrar parqueos activos en una sede y zona particular, crucial para el control de cupos.
    * `{ hora_entrada: -1 }`: Para consultar los parqueos más recientes.
    * `{ estado: 1, hora_salida: 1 }`: Útil para consultas de parqueos finalizados o activos, y para procesar los que están por finalizar.

---

## 4. Estructura de los Datos de Prueba (`test_dataset.js`)

El script `test_dataset.js` se encarga de poblar la base de datos con datos realistas para simular un escenario de uso de Campus Parking. Se utiliza `insertMany` para insertar documentos de forma eficiente.

**El conjunto de datos incluye:**

* **3 sedes:** Distribuidas en diferentes ciudades (Bogotá, Medellín, Cali).
* **5 zonas por sede:** Cada una con su `capacidad_maxima`, `cupos_disponibles`, `tarifas` específicas para diferentes `tipos_vehiculo_permitidos` (carro, moto, bicicleta, camioneta). Las tarifas están expresadas en **Pesos Colombianos (COP)** por hora.
* **10 empleados:** Asignados a las diferentes sedes.
* **15 clientes:** Con datos completos.
* **30 vehículos:** De al menos 4 tipos diferentes, asignados aleatoriamente a los clientes. Se generan placas y datos básicos.
* **50 registros de parqueos:** Mezclando sedes, zonas y tipos de vehículos. Aproximadamente el 70% de estos parqueos están `finalizados` (con hora de salida, costo y tiempo calculados), mientras que el 30% restante están `activos` (sin hora de salida ni costo final). Los `costo_total` para los parqueos finalizados también están en **Pesos Colombianos (COP)**.

---

## 5. Explicación de cada Agregación (`aggregations.js`)

El archivo `aggregations.js` contiene varias consultas analíticas complejas, utilizando el potente *Aggregation Framework* de MongoDB. Estas consultas demuestran cómo extraer información valiosa para la toma de decisiones.

**Nota:** Todas las agregaciones que involucran unir datos de diferentes colecciones (`$lookup`) requieren **MongoDB 3.2 o superior**. Los valores monetarios en los resultados de las agregaciones se interpretan como **Pesos Colombianos (COP)**.

1.  **¿Cuántos parqueos se registraron por sede en el último mes?**
    * `$match`: Filtra los parqueos que ocurrieron en los últimos 30 días.
    * `$group`: Agrupa los parqueos por `id_sede` y cuenta el total para cada una.
    * `$lookup`: Une con la colección `sedes` para obtener el nombre y la ciudad de la sede.
    * `$unwind`: Desestructura el array resultante del `$lookup`.
    * `$project`: Selecciona y renombra los campos de salida para mayor claridad.
    * `$sort`: Ordena los resultados por el número total de parqueos de forma descendente.

2.  **¿Cuáles son las zonas más ocupadas en cada sede (basado en parqueos finalizados)?**
    * `$match`: Filtra los parqueos `finalizado`s para obtener un historial de uso.
    * `$group`: Agrupa por `id_sede` y `id_zona` y cuenta los parqueos.
    * `$sort`: Ordena los resultados de parqueos por zona para que la más ocupada de cada sede quede primera.
    * `$group`: Agrupa nuevamente por `id_sede` para encontrar la "zona más ocupada" (la primera después del sort).
    * `$lookup`/`$unwind`: Unen con `sedes` y `zonas` para obtener nombres legibles.
    * `$project`: Formatea la salida.

3.  **¿Cuál es el ingreso total generado por parqueo en cada sede (en Pesos Colombianos COP)?**
    * `$match`: Filtra por parqueos `finalizado`s que tienen un `costo_total`.
    * `$group`: Agrupa por `id_sede` y suma todos los `costo_total`. **El resultado es el ingreso total en Pesos Colombianos (COP).**
    * `$lookup`/`$unwind`: Unen con `sedes` para obtener los nombres.
    * `$project`: Formatea la salida y redondea el ingreso.
    * `$sort`: Ordena por ingreso total.

4.  **¿Qué cliente ha usado más veces el parqueadero?**
    * `$lookup`: Une `parqueos` con `vehiculos` para obtener el `id_propietario`.
    * `$unwind`: Desestructura el resultado del `$lookup`.
    * `$group`: Agrupa por `id_propietario` y cuenta el total de parqueos.
    * `$sort`: Ordena para encontrar al cliente con más parqueos.
    * `$limit`: Limita a un solo resultado (el cliente principal).
    * `$lookup`/`$unwind`: Unen con `usuarios` para obtener la información completa del cliente.
    * `$project`: Formatea la salida.

5.  **¿Qué tipo de vehículo es más frecuente por sede?**
    * `$lookup`: Une `parqueos` con `vehiculos` para obtener el `tipo_vehiculo`.
    * `$unwind`: Desestructura.
    * `$group`: Agrupa por `id_sede` y `tipo_vehiculo`, contando las ocurrencias.
    * `$sort`: Ordena para que el tipo más frecuente quede primero dentro de cada sede.
    * `$group`: Agrupa por `id_sede` para identificar el tipo más frecuente en cada sede.
    * `$project`: Selecciona el tipo más frecuente de cada sede.
    * `$lookup`/`$unwind`: Unen con `sedes` para los nombres.
    * `$project`: Formatea la salida.

6.  **Dado un cliente, mostrar su historial de parqueos (fecha, sede, zona, tipo de vehículo, tiempo y costo en COP).**
    * Esta consulta toma un `ID_DEL_CLIENTE` (que se obtiene dinámicamente al principio del script).
    * `$lookup` (con `vehiculos`, `sedes`, `zonas`): Realiza múltiples uniones para obtener todos los detalles de cada parqueo.
    * `$unwind`: Desestructura los arrays resultantes de los `$lookup`.
    * `$match`: Filtra los parqueos por el `id_propietario` del vehículo.
    * `$project`: Selecciona y formatea los campos relevantes del historial. El `costo_total` se muestra en **Pesos Colombianos (COP)**.
    * `$sort`: Ordena el historial por fecha de entrada.

7.  **Mostrar los vehículos parqueados actualmente en cada sede.**
    * `$match`: Filtra por `estado: "activo"`.
    * `$lookup` (múltiple): Une con `vehiculos`, `sedes` y `zonas`.
    * `$unwind`: Desestructura los arrays resultantes de los `$lookup`.
    * `$group`: Agrupa por `id_sede` y acumula los detalles de los vehículos activos en un array.
    * `$project`: Formatea la salida para mostrar la sede y la lista de vehículos.

8.  **Listar zonas que han excedido su capacidad de parqueo en algún momento (heurística: parqueos activos > capacidad máxima).**
    * Esta es una consulta que depende de la interpretación de "exceder la capacidad". Sin un registro de eventos de sobrecupo, es difícil determinarlo históricamente.
    * La agregación propuesta usa una **heurística**: busca zonas donde el número de `parqueos` con `estado: "activo"` es actualmente mayor que la `capacidad_maxima` definida para esa zona.
    * `$match`: Filtra parqueos activos.
    * `$group`: Cuenta los parqueos activos por zona.
    * `$lookup`: Une con `zonas` para obtener su `capacidad_maxima`.
    * `$match` con `$expr`: Compara la cuenta de parqueos activos con la capacidad máxima.
    * `$lookup`: Une con `sedes` para contexto.
    * `$project`: Muestra la sede, zona, capacidad y el número de parqueos activos que la exceden.

---

## 6. Transacción MongoDB (`transactions.js`)

La transacción en MongoDB es fundamental para garantizar la atomicidad y consistencia en operaciones que afectan a múltiples documentos o colecciones. Este escenario requiere **MongoDB 4.0 o superior** y que la instancia de MongoDB sea parte de un **replica set o sharded cluster**. Las transacciones no funcionan en instancias standalone.

### Escenario utilizado: Registrar un nuevo ingreso de vehículo.

Esta operación debe ser atómica:
1.  Insertar un nuevo documento en la colección `parqueos`.
2.  Disminuir el campo `cupos_disponibles` en la colección `zonas` para la zona correspondiente.

Si cualquiera de estas dos operaciones falla, toda la transacción debe ser revertida (rollback) para mantener la consistencia de los datos (un parqueo no debe registrarse si no se pudo actualizar el cupo, y el cupo no debe disminuir si el parqueo no se registró).

### Código explicado paso a paso:

1.  **Obtención de Datos de Prueba:** Se buscan un `vehiculo`, `sede`, y `zona` de ejemplo con cupos disponibles para simular la operación.
2.  **`session = db.getMongo().startSession()`:** Se inicia una sesión cliente, que es el contexto bajo el cual se ejecutan las transacciones.
3.  **`session.startTransaction(...)`:** Se marca el inicio de la transacción. Se configuran `readConcern: 'snapshot'` (garantiza que la transacción ve una imagen consistente de los datos en el punto de inicio) y `writeConcern: { w: 'majority' }` (asegura que las escrituras se propagan a la mayoría de los miembros del replica set antes de confirmarse).
4.  **`session.getDatabase('campusParkingDB').parqueos.insertOne(nuevoParqueo)`:** Se inserta el nuevo documento de parqueo. Esta operación es parte de la transacción. El `costo_total` inicial se establece en `null` para parqueos activos, y se calculará en **Pesos Colombianos (COP)** cuando el parqueo finalice.
5.  **`session.getDatabase('campusParkingDB').zonas.updateOne(...)`:** Se actualiza el número de cupos disponibles en la zona. Esta operación también es parte de la transacción. Se incluye una condición `$gt: 0` para asegurar que el cupo no se reduzca por debajo de cero accidentalmente y para que la transacción aborte si ya no hay cupos.
6.  **Manejo de Errores y `throw new Error(...)`:** Si la actualización de los cupos no afecta a ningún documento (ej. por no encontrar la zona o porque los cupos ya eran cero), se lanza un error. Esto fuerza la interrupción del flujo normal y activa el `catch` para el `abortTransaction`.
7.  **`session.commitTransaction()`:** Si ambas operaciones se ejecutan con éxito, se realiza el commit. Esto hace que todos los cambios dentro de la transacción sean permanentes y visibles para otras operaciones fuera de la transacción.
8.  **`catch (error)` y `session.abortTransaction()`:** Si ocurre cualquier error durante las operaciones dentro del `try` (incluyendo los errores lanzados manualmente o errores de la base de datos), la ejecución salta al bloque `catch`. Aquí, `session.abortTransaction()` se encarga de revertir todos los cambios realizados desde `startTransaction()`, asegurando que la base de datos permanezca en su estado original.
9.  **`finally` y `session.endSession()`:** Siempre se ejecuta, finalizando la sesión, liberando recursos.

Este mecanismo asegura que el registro de un parqueo y la actualización de cupos son una operación única e indivisible, manteniendo la coherencia de los datos.

---

## 7. Roles (`roles.js`)

Se definen tres roles personalizados utilizando `db.createRole()` para controlar el acceso y los permisos dentro de la base de datos `campusParkingDB`. Luego, se asignan estos roles a usuarios de prueba existentes (Administrador, Empleados, Clientes) utilizando `db.grantRolesToUser()`.

### Descripción de cada rol:

* **`adminCampusParking` (Administrador):**
    * **Permisos:** Lectura y escritura total (`find`, `insert`, `update`, `remove`) en todas las colecciones dentro de `campusParkingDB`.
    * **Gestión de Usuarios/Roles:** Incluye privilegios a nivel de clúster para `createRole`, `dropRole`, `grantRole`, `revokeRole`, `createUser`, `dropUser`, `changeUserPassword`, lo que le permite administrar la seguridad de la base de datos.
* **`empleadoSede` (Empleado de Sede):**
    * **Permisos:**
        * **Lectura general:** `find` en `usuarios`, `vehiculos`, `sedes`, `zonas`. Esto permite a un empleado consultar clientes, vehículos, y ver la información de todas las sedes y zonas.
        * **Escritura:** `find`, `insert`, `update` en `parqueos`. Esto le permite registrar entradas y salidas.
        * **Actualización de Cupos:** `update` en `zonas` para poder disminuir o aumentar los `cupos_disponibles` al registrar un parqueo o salida.
    * **Restricción por Sede:** Aunque los permisos se definen a nivel de colección, la restricción de "solo puede acceder a zonas y sedes donde trabaja" se implementaría a nivel de **lógica de aplicación (backend)**, filtrando las consultas que el empleado puede realizar en función de su `id_sede_asignada`. MongoDB por sí solo no permite filtrar documentos con seguridad a nivel de documento para roles tan granulares sin un esfuerzo considerable (ej. usando `$redact` o `$match` en una vista de agregación para cada colección, lo cual sería muy complejo para este escenario).
* **`clienteCampusParking` (Cliente):**
    * **Permisos:**
        * **Lectura de su propia información:** `find` en `usuarios` (la lógica de la aplicación se encargaría de mostrar solo el documento del cliente autenticado).
        * **Lectura de sus vehículos y historial de parqueos:** `find` en `vehiculos` y `parqueos` (la aplicación filtraría por su `id_propietario`).
        * **Lectura de disponibilidad general:** `find` en `sedes` y `zonas` para consultar la disponibilidad y precios (que se entienden en **Pesos Colombianos (COP)**).

### Ejemplo de creación de usuarios con esos roles:

El script `roles.js` incluye la creación de un usuario `adminCampusParking` y la asignación programática de los roles `empleadoSede` y `clienteCampusParking` a los usuarios ya existentes en la base de datos (creados en `test_dataset.js`) basándose en sus direcciones de correo electrónico.

**Para ejecutar este script, necesitarás conectarte a MongoDB como un usuario que tenga permisos para crear usuarios y roles (ej., el usuario `root` o un usuario con el rol `userAdminAnyDatabase`).**

---

## 8. Conclusiones y Mejoras Posibles

### Conclusiones

Este proyecto demuestra una implementación robusta y flexible para la gestión de Campus Parking utilizando MongoDB. Se ha cubierto el diseño del modelo de datos con validaciones, la población con datos de prueba (incluyendo tarifas y costos en **Pesos Colombianos (COP)**), la extracción de información valiosa mediante agregaciones complejas, la implementación de un modelo de seguridad basado en roles, y la garantía de consistencia de datos con transacciones.

La elección de MongoDB es adecuada dada la naturaleza variable de los datos (diferentes tipos de vehículos, tarifas dinámicas) y la necesidad de escalabilidad. La capacidad de realizar uniones (`$lookup`) y agregaciones en el servidor reduce la complejidad de la lógica de aplicación y mejora el rendimiento para los reportes.

### Mejoras Posibles

1.  **Encriptación de Contraseñas:** En un entorno de producción, las contraseñas (`password`) en la colección `usuarios` deben estar **hasheadas** utilizando algoritmos seguros (ej. bcrypt) y nunca almacenarse en texto plano.
2.  **Seguridad a Nivel de Documento:** Para los roles `empleadoSede` y `clienteCampusParking`, la filtración de datos por sede o por usuario (`id_propietario`) se implementa actualmente a nivel de aplicación. Para una seguridad más robusta directamente en la base de datos, se podrían considerar vistas de agregación (`$match`, `$redact`) o la implementación de **reglas de autenticación más granulares** si se usara un servicio como MongoDB Atlas con su funcionalidad de "Queryable Encryption" o con funciones de computación sin servidor (Realm Functions) para aplicar reglas de seguridad a nivel de documento.
3.  **Logs de Auditoría:** Implementar una colección de logs para registrar operaciones críticas (ej. quién registró un parqueo, quién modificó tarifas) para auditoría y depuración.
4.  **Gestión de Eventos Históricos de Zonas:** Para la consulta de "zonas que han excedido su capacidad", sería ideal tener un registro histórico de la ocupación de cada zona en el tiempo, o un sistema de eventos que registre específicamente cuándo una zona alcanzó o excedió su capacidad máxima. Esto podría lograrse con una colección dedicada a eventos de ocupación o con streams de cambio (Change Streams) para reaccionar a las actualizaciones de `cupos_disponibles`.
5.  **Optimización de Índices Avanzada:** Realizar un análisis de rendimiento real de las consultas más frecuentes en un entorno de producción para ajustar y añadir índices compuestos o multi-clave adicionales según sea necesario.
6.  **Implementación de Backend (Node.js/Python):** Desarrollar una API RESTful para interactuar con la base de datos, manejando la lógica de negocio, autenticación, autorización y la interfaz con la aplicación de frontend.
7.  **Front-end:** Desarrollar una interfaz de usuario para que los administradores, empleados y clientes puedan interactuar con el sistema de parqueo.
8.  **Automatización de Cierre de Parqueos:** Implementar un servicio batch o una función programada que recorra periódicamente los parqueos `activos` y, si la `hora_salida` se excede de un límite (o si hay una señal de salida de un sensor), actualice su estado a `finalizado`, calcule el costo (en **Pesos Colombianos (COP)**) y libere el cupo.