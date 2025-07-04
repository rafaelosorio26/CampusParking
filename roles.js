// ¡Importante! Para que este bloque funcione, el usuario con el que te conectaste a MongoDB Atlas debe tener permisos para crear usuarios y roles (ej., el rol userAdminAnyDatabase o Atlas Admin). Si no, esta parte podría fallar.

// Conectarse a la base de datos
use('campusParkingDB');

print("\n--- Configurando Roles y Usuarios ---");

// Crear rol de Administrador de Campus Parking
db.createRole(
    {
        role: "adminCampusParking",
        privileges: [
            { resource: { db: "campusParkingDB", collection: "" }, actions: ["find", "insert", "update", "remove"] },
            // Privilegios para administrar usuarios y roles a nivel de cluster
            { resource: { cluster: true }, actions: ["createRole", "dropRole", "grantRole", "revokeRole", "createUser", "dropUser", "changeUserPassword"] }
        ],
        roles: []
    }
);
print("Rol 'adminCampusParking' creado.");

// Crear rol de Empleado de Sede
db.createRole(
    {
        role: "empleadoSede",
        privileges: [
            // Permisos de lectura general
            { resource: { db: "campusParkingDB", collection: "usuarios" }, actions: ["find"] },
            { resource: { db: "campusParkingDB", collection: "vehiculos" }, actions: ["find"] },
            { resource: { db: "campusParkingDB", collection: "sedes" }, actions: ["find"] },
            { resource: { db: "campusParkingDB", collection: "zonas" }, actions: ["find", "update"] }, // Update para cupos
            // Permisos de escritura para parqueos
            { resource: { db: "campusParkingDB", collection: "parqueos" }, actions: ["find", "insert", "update"] }
        ],
        roles: []
    }
);
print("Rol 'empleadoSede' creado.");

// Crear rol de Cliente de Campus Parking
db.createRole(
    {
        role: "clienteCampusParking",
        privileges: [
            // Permisos de lectura para su propia info y sus vehículos/parqueos
            { resource: { db: "campusParkingDB", collection: "usuarios" }, actions: ["find"] },
            { resource: { db: "campusParkingDB", collection: "vehiculos" }, actions: ["find"] },
            { resource: { db: "campusParkingDB", collection: "parqueos" }, actions: ["find"] },
            // Permisos de lectura para disponibilidad general
            { resource: { db: "campusParkingDB", collection: "sedes" }, actions: ["find"] },
            { resource: { db: "campusParkingDB", collection: "zonas" }, actions: ["find"] }
        ],
        roles: []
    }
);
print("Rol 'clienteCampusParking' creado.");

// --- Asignar roles a usuarios existentes ---

// Asignar rol de administrador a un usuario de ejemplo (crea el usuario si no existe)
try {
    db.createUser(
        {
            user: "adminUser",
            pwd: "adminPassword123", // Cambiar por una contraseña segura en producción
            roles: [
                { role: "adminCampusParking", db: "campusParkingDB" }
            ]
        }
    );
    print("Usuario 'adminUser' creado y rol 'adminCampusParking' asignado.");
} catch (e) {
    if (e.code === 51) { // Error code 51 means user already exists
        print("Usuario 'adminUser' ya existe. Asignando rol 'adminCampusParking'...");
        db.grantRolesToUser(
            "adminUser",
            [{ role: "adminCampusParking", db: "campusParkingDB" }]
        );
        print("Rol 'adminCampusParking' asignado a 'adminUser'.");
    } else {
        print(`Error al crear/asignar rol a 'adminUser': ${e}`);
    }
}


// Asignar rol 'empleadoSede' a los usuarios con tipo_usuario 'Empleado'
const empleados = db.usuarios.find({ tipo_usuario: 'Empleado' }).toArray();
empleados.forEach(empleado => {
    try {
        db.createUser(
            {
                user: empleado.email,
                pwd: empleado.password, // Usar la contraseña de prueba del dataset
                roles: [
                    { role: "empleadoSede", db: "campusParkingDB" }
                ]
            }
        );
        print(`Usuario '${empleado.email}' creado y rol 'empleadoSede' asignado.`);
    } catch (e) {
        if (e.code === 51) {
            print(`Usuario '${empleado.email}' ya existe. Asignando rol 'empleadoSede' si no lo tiene...`);
            db.grantRolesToUser(
                empleado.email,
                [{ role: "empleadoSede", db: "campusParkingDB" }]
            );
            print(`Rol 'empleadoSede' asignado a '${empleado.email}'.`);
        } else {
            print(`Error al crear/asignar rol a '${empleado.email}': ${e}`);
        }
    }
});

// Asignar rol 'clienteCampusParking' a los usuarios con tipo_usuario 'Cliente'
const clientes = db.usuarios.find({ tipo_usuario: 'Cliente' }).toArray();
clientes.forEach(cliente => {
    try {
        db.createUser(
            {
                user: cliente.email,
                pwd: cliente.password, // Usar la contraseña de prueba del dataset
                roles: [
                    { role: "clienteCampusParking", db: "campusParkingDB" }
                ]
            }
        );
        print(`Usuario '${cliente.email}' creado y rol 'clienteCampusParking' asignado.`);
    } catch (e) {
        if (e.code === 51) {
            print(`Usuario '${cliente.email}' ya existe. Asignando rol 'clienteCampusParking' si no lo tiene...`);
            db.grantRolesToUser(
                cliente.email,
                [{ role: "clienteCampusParking", db: "campusParkingDB" }]
            );
            print(`Rol 'clienteCampusParking' asignado a '${cliente.email}'.`);
        } else {
            print(`Error al crear/asignar rol a '${cliente.email}': ${e}`);
        }
    }
});

print("\n--- Configuración de roles y usuarios completada. ---");