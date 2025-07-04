// Conectarse a la base de datos
use('campusParkingDB');

print("\n--- Ejecutando Consultas de Agregación ---");

// 1. ¿Cuántos parqueos se registraron por sede en el último mes?
print("\n1. Parqueos registrados por sede en el último mes:");
const unMesAtras = new Date();
unMesAtras.setMonth(unMesAtras.getMonth() - 1);

db.parqueos.aggregate([
    {
        $match: {
            hora_entrada: { $gte: unMesAtras }
        }
    },
    {
        $group: {
            _id: "$id_sede",
            total_parqueos: { $sum: 1 }
        }
    },
    {
        $lookup: {
            from: "sedes",
            localField: "_id",
            foreignField: "_id",
            as: "sede_info"
        }
    },
    {
        $unwind: "$sede_info"
    },
    {
        $project: {
            _id: 0,
            sede: "$sede_info.nombre",
            ciudad: "$sede_info.ciudad",
            total_parqueos: 1
        }
    },
    {
        $sort: { total_parqueos: -1 }
    }
]).forEach(printjson);

// 2. ¿Cuáles son las zonas más ocupadas en cada sede (basado en parqueos finalizados)?
print("\n2. Zonas más ocupadas en cada sede (basado en parqueos finalizados):");
db.parqueos.aggregate([
    {
        $match: { estado: "finalizado" }
    },
    {
        $group: {
            _id: { sedeId: "$id_sede", zonaId: "$id_zona" },
            conteo_parqueos: { $sum: 1 }
        }
    },
    {
        $sort: { conteo_parqueos: -1 } // Ordena para que la zona más ocupada de cada sede quede primera
    },
    {
        $group: {
            _id: "$_id.sedeId",
            zona_mas_ocupada: { $first: "$_id.zonaId" },
            conteo_maximo: { $first: "$conteo_parqueos" }
        }
    },
    {
        $lookup: {
            from: "sedes",
            localField: "_id",
            foreignField: "_id",
            as: "sede_info"
        }
    },
    {
        $unwind: "$sede_info"
    },
    {
        $lookup: {
            from: "zonas",
            localField: "zona_mas_ocupada",
            foreignField: "_id",
            as: "zona_info"
        }
    },
    {
        $unwind: "$zona_info"
    },
    {
        $project: {
            _id: 0,
            sede: "$sede_info.nombre",
            zona_mas_ocupada: "$zona_info.nombre_zona",
            conteo_parqueos: "$conteo_maximo"
        }
    }
]).forEach(printjson);

// 3. ¿Cuál es el ingreso total generado por parqueo en cada sede (en Pesos Colombianos COP)?
print("\n3. Ingreso total generado por parqueo en cada sede (en Pesos Colombianos COP):");
db.parqueos.aggregate([
    {
        $match: {
            estado: "finalizado",
            costo_total: { $ne: null }
        }
    },
    {
        $group: {
            _id: "$id_sede",
            ingreso_total_cop: { $sum: "$costo_total" }
        }
    },
    {
        $lookup: {
            from: "sedes",
            localField: "_id",
            foreignField: "_id",
            as: "sede_info"
        }
    },
    {
        $unwind: "$sede_info"
    },
    {
        $project: {
            _id: 0,
            sede: "$sede_info.nombre",
            ciudad: "$sede_info.ciudad",
            ingreso_total_cop: { $round: ["$ingreso_total_cop", 2] } // Redondear a 2 decimales
        }
    },
    {
        $sort: { ingreso_total_cop: -1 }
    }
]).forEach(printjson);

// 4. ¿Qué cliente ha usado más veces el parqueadero?
print("\n4. Cliente que ha usado más veces el parqueadero:");
db.parqueos.aggregate([
    {
        $lookup: {
            from: "vehiculos",
            localField: "id_vehiculo",
            foreignField: "_id",
            as: "vehiculo_info"
        }
    },
    {
        $unwind: "$vehiculo_info"
    },
    {
        $group: {
            _id: "$vehiculo_info.id_propietario",
            total_parqueos: { $sum: 1 }
        }
    },
    {
        $sort: { total_parqueos: -1 }
    },
    {
        $limit: 1
    },
    {
        $lookup: {
            from: "usuarios",
            localField: "_id",
            foreignField: "_id",
            as: "cliente_info"
        }
    },
    {
        $unwind: "$cliente_info"
    },
    {
        $project: {
            _id: 0,
            nombre_cliente: "$cliente_info.nombre",
            apellido_cliente: "$cliente_info.apellido",
            email_cliente: "$cliente_info.email",
            total_parqueos: 1
        }
    }
]).forEach(printjson);

// 5. ¿Qué tipo de vehículo es más frecuente por sede?
print("\n5. Tipo de vehículo más frecuente por sede:");
db.parqueos.aggregate([
    {
        $lookup: {
            from: "vehiculos",
            localField: "id_vehiculo",
            foreignField: "_id",
            as: "vehiculo_info"
        }
    },
    {
        $unwind: "$vehiculo_info"
    },
    {
        $group: {
            _id: { sedeId: "$id_sede", tipoVehiculo: "$vehiculo_info.tipo_vehiculo" },
            conteo: { $sum: 1 }
        }
    },
    {
        $sort: { conteo: -1 }
    },
    {
        $group: {
            _id: "$_id.sedeId",
            tipo_mas_frecuente: { $first: "$_id.tipoVehiculo" },
            conteo_maximo: { $first: "$conteo" }
        }
    },
    {
        $lookup: {
            from: "sedes",
            localField: "_id",
            foreignField: "_id",
            as: "sede_info"
        }
    },
    {
        $unwind: "$sede_info"
    },
    {
        $project: {
            _id: 0,
            sede: "$sede_info.nombre",
            tipo_vehiculo_mas_frecuente: "$tipo_mas_frecuente",
            conteo: "$conteo_maximo"
        }
    }
]).forEach(printjson);

// 6. Dado un cliente, mostrar su historial de parqueos (fecha, sede, zona, tipo de vehículo, tiempo y costo en COP).
print("\n6. Historial de parqueos para un cliente específico:");
// Obtener un ID de cliente de ejemplo de la base de datos
const clienteEjemplo = db.usuarios.findOne({ tipo_usuario: 'Cliente' });
if (clienteEjemplo) {
    const idClienteEjemplo = clienteEjemplo._id;
    print(`Historial para el cliente: ${clienteEjemplo.nombre} ${clienteEjemplo.apellido} (ID: ${idClienteEjemplo})`);

    db.parqueos.aggregate([
        {
            $lookup: {
                from: "vehiculos",
                localField: "id_vehiculo",
                foreignField: "_id",
                as: "vehiculo_info"
            }
        },
        {
            $unwind: "$vehiculo_info"
        },
        {
            $match: { "vehiculo_info.id_propietario": idClienteEjemplo }
        },
        {
            $lookup: {
                from: "sedes",
                localField: "id_sede",
                foreignField: "_id",
                as: "sede_info"
            }
        },
        {
            $unwind: "$sede_info"
        },
        {
            $lookup: {
                from: "zonas",
                localField: "id_zona",
                foreignField: "_id",
                as: "zona_info"
            }
        },
        {
            $unwind: "$zona_info"
        },
        {
            $project: {
                _id: 0,
                fecha_entrada: "$hora_entrada",
                fecha_salida: "$hora_salida",
                sede: "$sede_info.nombre",
                zona: "$zona_info.nombre_zona",
                placa_vehiculo: "$vehiculo_info.placa",
                tipo_vehiculo: "$vehiculo_info.tipo_vehiculo",
                tiempo_total_minutos: { $ifNull: ["$tiempo_total_minutos", "Activo"] },
                costo_total_cop: { $ifNull: ["$costo_total", "Activo"] } // Mostrar "Activo" si no hay costo
            }
        },
        {
            $sort: { fecha_entrada: -1 }
        }
    ]).forEach(printjson);
} else {
    print("No se encontró ningún cliente de ejemplo para esta consulta.");
}


// 7. Mostrar los vehículos parqueados actualmente en cada sede.
print("\n7. Vehículos parqueados actualmente en cada sede:");
db.parqueos.aggregate([
    {
        $match: { estado: "activo" }
    },
    {
        $lookup: {
            from: "vehiculos",
            localField: "id_vehiculo",
            foreignField: "_id",
            as: "vehiculo_info"
        }
    },
    {
        $unwind: "$vehiculo_info"
    },
    {
        $lookup: {
            from: "sedes",
            localField: "id_sede",
            foreignField: "_id",
            as: "sede_info"
        }
    },
    {
        $unwind: "$sede_info"
    },
    {
        $lookup: {
            from: "zonas",
            localField: "id_zona",
            foreignField: "_id",
            as: "zona_info"
        }
    },
    {
        $unwind: "$zona_info"
    },
    {
        $group: {
            _id: "$id_sede",
            nombre_sede: { $first: "$sede_info.nombre" },
            vehiculos_parqueados: {
                $push: {
                    placa: "$vehiculo_info.placa",
                    tipo: "$vehiculo_info.tipo_vehiculo",
                    zona: "$zona_info.nombre_zona",
                    hora_entrada: "$hora_entrada"
                }
            }
        }
    },
    {
        $project: {
            _id: 0,
            sede: "$nombre_sede",
            total_vehiculos_parqueados: { $size: "$vehiculos_parqueados" },
            vehiculos_parqueados: 1
        }
    }
]).forEach(printjson);

// 8. Listar zonas que han excedido su capacidad de parqueo en algún momento (heurística: parqueos activos > capacidad máxima).
print("\n8. Zonas que actualmente tienen más parqueos activos que su capacidad máxima:");
db.parqueos.aggregate([
    {
        $match: { estado: "activo" }
    },
    {
        $group: {
            _id: "$id_zona",
            parqueos_activos: { $sum: 1 }
        }
    },
    {
        $lookup: {
            from: "zonas",
            localField: "_id",
            foreignField: "_id",
            as: "zona_info"
        }
    },
    {
        $unwind: "$zona_info"
    },
    {
        $match: {
            $expr: { $gt: ["$parqueos_activos", "$zona_info.capacidad_maxima"] }
        }
    },
    {
        $lookup: {
            from: "sedes",
            localField: "zona_info.id_sede",
            foreignField: "_id",
            as: "sede_info"
        }
    },
    {
        $unwind: "$sede_info"
    },
    {
        $project: {
            _id: 0,
            sede: "$sede_info.nombre",
            zona: "$zona_info.nombre_zona",
            capacidad_maxima: "$zona_info.capacidad_maxima",
            parqueos_activos_actuales: "$parqueos_activos"
        }
    }
]).forEach(printjson);

print("\n--- Ejecución de agregaciones completada. ---");