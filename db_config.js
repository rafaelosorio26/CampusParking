// Este código crea la base de datos campusParkingDB, define las colecciones con sus esquemas de validación y establece los índices necesarios.


// Conectarse a la base de datos 'campusParkingDB' o crearla si no existe
use('campusParkingDB');

// --- Limpiar colecciones existentes (opcional, para iniciar limpio) ---
// Descomenta las siguientes líneas si quieres eliminar las colecciones antes de recrearlas.
// Esto es útil para reiniciar el esquema desde cero.
db.parqueos.drop();
db.zonas.drop();
db.sedes.drop();
db.vehiculos.drop();
db.usuarios.drop();
print("Colecciones limpiadas (si existían).");

// --- 1. Crear Colección de Usuarios con Validación de Esquema ---
db.createCollection("usuarios", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["tipo_usuario", "nombre", "apellido", "email", "password"],
            properties: {
                tipo_usuario: {
                    bsonType: "string",
                    description: "Debe ser 'Administrador', 'Empleado' o 'Cliente'",
                    enum: ["Administrador", "Empleado", "Cliente"]
                },
                nombre: {
                    bsonType: "string",
                    description: "Debe ser un string y es requerido"
                },
                apellido: {
                    bsonType: "string",
                    description: "Debe ser un string y es requerido"
                },
                email: {
                    bsonType: "string",
                    description: "Debe ser un string y es requerido",
                    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
                },
                password: {
                    bsonType: "string",
                    description: "Debe ser un string y es requerido (se recomienda hash en producción)"
                },
                cedula: {
                    bsonType: "A", // Acepta string o int
                    description: "Puede ser un string o un número (opcional)"
                },
                telefono: {
                    bsonType: "string",
                    description: "Debe ser un string (opcional)"
                },
                direccion: {
                    bsonType: "string",
                    description: "Debe ser un string (opcional)"
                },
                id_sede_asignada: {
                    bsonType: "objectId",
                    description: "ID de la sede a la que está asignado el empleado (opcional, solo para Empleados)"
                }
            }
        }
    }
});
print("Colección 'usuarios' creada con validación.");

// --- 2. Crear Colección de Vehículos con Validación de Esquema ---
db.createCollection("vehiculos", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["placa", "tipo_vehiculo", "marca", "modelo", "id_propietario"],
            properties: {
                placa: {
                    bsonType: "string",
                    description: "Debe ser un string y es requerido"
                },
                tipo_vehiculo: {
                    bsonType: "string",
                    description: "Debe ser 'carro', 'moto', 'bicicleta' o 'camioneta'",
                    enum: ["carro", "moto", "bicicleta", "camioneta"]
                },
                marca: {
                    bsonType: "string",
                    description: "Debe ser un string y es requerido"
                },
                modelo: {
                    bsonType: "string",
                    description: "Debe ser un string y es requerido"
                },
                color: {
                    bsonType: "string",
                    description: "Debe ser un string (opcional)"
                },
                id_propietario: {
                    bsonType: "objectId",
                    description: "ID del usuario propietario (cliente) y es requerido"
                }
            }
        }
    }
});
print("Colección 'vehiculos' creada con validación.");

// --- 3. Crear Colección de Sedes con Validación de Esquema ---
db.createCollection("sedes", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["nombre", "ciudad", "direccion", "telefono"],
            properties: {
                nombre: {
                    bsonType: "string",
                    description: "Debe ser un string y es requerido"
                },
                ciudad: {
                    bsonType: "string",
                    description: "Debe ser un string y es requerido"
                },
                direccion: {
                    bsonType: "string",
                    description: "Debe ser un string y es requerido"
                },
                telefono: {
                    bsonType: "string",
                    description: "Debe ser un string y es requerido"
                }
            }
        }
    }
});
print("Colección 'sedes' creada con validación.");

// --- 4. Crear Colección de Zonas con Validación de Esquema ---
db.createCollection("zonas", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["nombre_zona", "id_sede", "capacidad_maxima", "cupos_disponibles", "tarifas", "tipos_vehiculo_permitidos"],
            properties: {
                nombre_zona: {
                    bsonType: "string",
                    description: "Debe ser un string y es requerido"
                },
                id_sede: {
                    bsonType: "objectId",
                    description: "ID de la sede a la que pertenece la zona y es requerido"
                },
                capacidad_maxima: {
                    bsonType: "int",
                    minimum: 0,
                    description: "Debe ser un entero no negativo y es requerido"
                },
                cupos_disponibles: {
                    bsonType: "int",
                    minimum: 0,
                    description: "Debe ser un entero no negativo y es requerido"
                },
                tarifas: {
                    bsonType: "object",
                    description: "Objeto que contiene tarifas por tipo de vehículo (en Pesos Colombianos COP)",
                    patternProperties: {
                        "^(carro|moto|bicicleta|camioneta)$": {
                            bsonType: "double",
                            minimum: 0,
                            description: "La tarifa debe ser un número doble no negativo."
                        }
                    },
                    additionalProperties: false // No permite propiedades fuera de los tipos de vehículo definidos
                },
                tipos_vehiculo_permitidos: {
                    bsonType: "array",
                    minItems: 1,
                    items: {
                        bsonType: "string",
                        enum: ["carro", "moto", "bicicleta", "camioneta"]
                    },
                    description: "Array de strings con los tipos de vehículo permitidos y es requerido"
                }
            }
        }
    }
});
print("Colección 'zonas' creada con validación.");

// --- 5. Crear Colección de Parqueos con Validación de Esquema ---
db.createCollection("parqueos", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["id_vehiculo", "id_sede", "id_zona", "hora_entrada", "estado"],
            properties: {
                id_vehiculo: {
                    bsonType: "objectId",
                    description: "ID del vehículo parqueado y es requerido"
                },
                id_sede: {
                    bsonType: "objectId",
                    description: "ID de la sede donde se realizó el parqueo y es requerido"
                },
                id_zona: {
                    bsonType: "objectId",
                    description: "ID de la zona donde se realizó el parqueo y es requerido"
                },
                hora_entrada: {
                    bsonType: "date",
                    description: "Fecha y hora de entrada y es requerido"
                },
                hora_salida: {
                    bsonType: ["date", "null"],
                    description: "Fecha y hora de salida (null si el parqueo está activo)"
                },
                tiempo_total_minutos: {
                    bsonType: ["int", "null"],
                    minimum: 0,
                    description: "Tiempo total en minutos (null si el parqueo está activo)"
                },
                costo_total: {
                    bsonType: ["double", "null"],
                    minimum: 0,
                    description: "Costo total del parqueo en Pesos Colombianos (COP) (null si activo)"
                },
                estado: {
                    bsonType: "string",
                    description: "Estado del parqueo: 'activo' o 'finalizado'",
                    enum: ["activo", "finalizado"]
                }
            }
        }
    }
});
print("Colección 'parqueos' creada con validación.");

// --- Creación de Índices para Optimización y Unicidad ---
// Índices para 'usuarios'
db.usuarios.createIndex({ email: 1 }, { unique: true });
db.usuarios.createIndex({ cedula: 1 }, { unique: true, sparse: true }); // sparse permite documentos sin el campo
db.usuarios.createIndex({ tipo_usuario: 1, id_sede_asignada: 1 });
print("Índices para 'usuarios' creados.");

// Índices para 'vehiculos'
db.vehiculos.createIndex({ placa: 1 }, { unique: true });
db.vehiculos.createIndex({ id_propietario: 1 });
db.vehiculos.createIndex({ tipo_vehiculo: 1 });
print("Índices para 'vehiculos' creados.");

// Índices para 'sedes'
db.sedes.createIndex({ nombre: 1 }, { unique: true });
db.sedes.createIndex({ ciudad: 1 });
print("Índices para 'sedes' creados.");

// Índices para 'zonas'
db.zonas.createIndex({ id_sede: 1, nombre_zona: 1 }, { unique: true });
db.zonas.createIndex({ id_sede: 1, cupos_disponibles: -1 }); // Para encontrar zonas con cupos rápidamente
print("Índices para 'zonas' creados.");

// Índices para 'parqueos'
db.parqueos.createIndex({ id_vehiculo: 1 });
db.parqueos.createIndex({ id_sede: 1, id_zona: 1, estado: 1 });
db.parqueos.createIndex({ hora_entrada: -1 });
db.parqueos.createIndex({ estado: 1, hora_salida: 1 });
print("Índices para 'parqueos' creados.");

print("\n--- Configuración de la base de datos completada. ---");