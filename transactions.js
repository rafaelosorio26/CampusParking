// ¡Importante! Las transacciones requieren que tu cluster de MongoDB Atlas sea un replica set. Los clusters M0 (gratuitos) en Atlas ya son replica sets, así que debería funcionar.

// Conectarse a la base de datos
use('campusParkingDB');

print("\n--- Demostración de Transacción: Registrar Ingreso de Vehículo ---");

// 1. Obtener un vehículo, sede y zona de ejemplo con cupos disponibles
const vehiculoEjemplo = db.vehiculos.findOne({ tipo_vehiculo: 'carro' });
const sedeEjemplo = db.sedes.findOne({}); // Cualquier sede
const zonaEjemplo = db.zonas.findOne({
    id_sede: sedeEjemplo._id,
    tipos_vehiculo_permitidos: "carro",
    cupos_disponibles: { $gt: 0 }
});

if (!vehiculoEjemplo || !sedeEjemplo || !zonaEjemplo) {
    print("No se pudieron encontrar los datos de ejemplo necesarios (vehículo, sede o zona con cupos). Asegúrate de haber ejecutado 'test_dataset.js'.");
} else {
    print(`Intentando registrar parqueo para vehículo: ${vehiculoEjemplo.placa} en zona: ${zonaEjemplo.nombre_zona} (${sedeEjemplo.nombre}).`);

    // Iniciar una sesión para la transacción
    const session = db.getMongo().startSession();

    try {
        // Iniciar la transacción
        session.startTransaction({
            readConcern: { level: 'snapshot' },
            writeConcern: { w: 'majority' }
        });
        print("Transacción iniciada.");

        // Operación 1: Insertar el nuevo parqueo
        const nuevoParqueo = {
            id_vehiculo: vehiculoEjemplo._id,
            id_sede: sedeEjemplo._id,
            id_zona: zonaEjemplo._id,
            hora_entrada: new Date(),
            estado: "activo",
            hora_salida: null,
            tiempo_total_minutos: null,
            costo_total: null
        };

        const insertResult = session.getDatabase('campusParkingDB').parqueos.insertOne(nuevoParqueo);
        print(`Parqueo insertado con ID: ${insertResult.insertedId}`);

        // Operación 2: Disminuir cupos disponibles en la zona
        const updateResult = session.getDatabase('campusParkingDB').zonas.updateOne(
            { _id: zonaEjemplo._id, cupos_disponibles: { $gt: 0 } }, // Asegura que haya cupos antes de decrementar
            { $inc: { cupos_disponibles: -1 } },
            { session: session } // Importante: especificar la sesión
        );

        if (updateResult.modifiedCount === 0) {
            throw new Error("No se pudo actualizar el número de cupos disponibles. Posiblemente la zona no existe o no tiene cupos.");
        }
        print(`Cupos de la zona '${zonaEjemplo.nombre_zona}' actualizados. Cupos restantes: ${zonaEjemplo.cupos_disponibles - 1}`);

        // Si ambas operaciones fueron exitosas, confirmar la transacción
        session.commitTransaction();
        print("Transacción confirmada: Parqueo registrado y cupos actualizados exitosamente.");

    } catch (error) {
        // Si algo falla, abortar la transacción
        print(`Error en la transacción: ${error.message}`);
        session.abortTransaction();
        print("Transacción abortada: Se han revertido todos los cambios.");
    } finally {
        // Finalizar la sesión
        session.endSession();
        print("Sesión de transacción finalizada.");
    }
}

print("\n--- Demostración de Transacción completada. ---");