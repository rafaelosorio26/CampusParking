// Conectarse a la base de datos
use('campusParkingDB');

// --- Limpiar colecciones existentes (opcional, para iniciar limpio) ---
// Descomenta las siguientes líneas si quieres eliminar los datos antes de insertarlos.
// Esto es útil si quieres reiniciar los datos sin eliminar el esquema.
// db.parqueos.drop();
// db.zonas.drop();
// db.sedes.drop();
// db.vehiculos.drop();
// db.usuarios.drop();
// print("Colecciones limpiadas.");

// --- 1. Insertar Sedes ---
const sedes = [
    { nombre: 'Sede Principal Bogotá', ciudad: 'Bogotá', direccion: 'Calle 100 #15-30', telefono: '6011234567' },
    { nombre: 'Sede Norte Medellín', ciudad: 'Medellín', direccion: 'Carrera 50 #45-10', telefono: '6047654321' },
    { nombre: 'Sede Sur Cali', ciudad: 'Cali', direccion: 'Avenida 3 #20-50', telefono: '6029876543' }
];
db.sedes.insertMany(sedes);
print(`Insertadas ${sedes.length} sedes.`);

const sedeIds = db.sedes.find().map(s => s._id);

// --- 2. Insertar Zonas ---
const zonas = [];
const tiposVehiculoComunes = ['carro', 'moto', 'bicicleta', 'camioneta'];

// Zonas para Sede Principal Bogotá (sedeIds[0])
zonas.push(
    {
        nombre_zona: 'Zona A - Carros',
        id_sede: sedeIds[0],
        capacidad_maxima: 50,
        cupos_disponibles: 45,
        tarifas: { carro: 3500, camioneta: 4500 }, // Valores en COP por hora
        tipos_vehiculo_permitidos: ['carro', 'camioneta']
    },
    {
        nombre_zona: 'Zona B - Motos',
        id_sede: sedeIds[0],
        capacidad_maxima: 30,
        cupos_disponibles: 28,
        tarifas: { moto: 1500 }, // Valores en COP por hora
        tipos_vehiculo_permitidos: ['moto']
    },
    {
        nombre_zona: 'Zona C - Mixta',
        id_sede: sedeIds[0],
        capacidad_maxima: 20,
        cupos_disponibles: 15,
        tarifas: { carro: 3000, moto: 1200, bicicleta: 500 }, // Valores en COP por hora
        tipos_vehiculo_permitidos: ['carro', 'moto', 'bicicleta']
    },
    {
        nombre_zona: 'Zona D - Bicicletas',
        id_sede: sedeIds[0],
        capacidad_maxima: 40,
        cupos_disponibles: 38,
        tarifas: { bicicleta: 400 }, // Valores en COP por hora
        tipos_vehiculo_permitidos: ['bicicleta']
    },
    {
        nombre_zona: 'Zona E - Vip',
        id_sede: sedeIds[0],
        capacidad_maxima: 10,
        cupos_disponibles: 8,
        tarifas: { carro: 5000, camioneta: 6000 }, // Valores en COP por hora
        tipos_vehiculo_permitidos: ['carro', 'camioneta']
    }
);

// Zonas para Sede Norte Medellín (sedeIds[1])
zonas.push(
    {
        nombre_zona: 'Nivel 1 - Vehículos Pequeños',
        id_sede: sedeIds[1],
        capacidad_maxima: 60,
        cupos_disponibles: 55,
        tarifas: { carro: 3000, moto: 1000 }, // Valores en COP por hora
        tipos_vehiculo_permitidos: ['carro', 'moto']
    },
    {
        nombre_zona: 'Nivel 2 - Vehículos Grandes',
        id_sede: sedeIds[1],
        capacidad_maxima: 40,
        cupos_disponibles: 35,
        tarifas: { carro: 4000, camioneta: 5000 }, // Valores en COP por hora
        tipos_vehiculo_permitidos: ['carro', 'camioneta']
    },
    {
        nombre_zona: 'Nivel 3 - Motos y Bicis',
        id_sede: sedeIds[1],
        capacidad_maxima: 50,
        cupos_disponibles: 48,
        tarifas: { moto: 1200, bicicleta: 300 }, // Valores en COP por hora
        tipos_vehiculo_permitidos: ['moto', 'bicicleta']
    },
    {
        nombre_zona: 'Zona Express',
        id_sede: sedeIds[1],
        capacidad_maxima: 15,
        cupos_disponibles: 10,
        tarifas: { carro: 3800, moto: 1800 }, // Valores en COP por hora
        tipos_vehiculo_permitidos: ['carro', 'moto']
    },
    {
        nombre_zona: 'Zona Ecológica',
        id_sede: sedeIds[1],
        capacidad_maxima: 25,
        cupos_disponibles: 22,
        tarifas: { bicicleta: 500 }, // Valores en COP por hora
        tipos_vehiculo_permitidos: ['bicicleta']
    }
);

// Zonas para Sede Sur Cali (sedeIds[2])
zonas.push(
    {
        nombre_zona: 'Piso 1 - Acceso Rápido',
        id_sede: sedeIds[2],
        capacidad_maxima: 30,
        cupos_disponibles: 25,
        tarifas: { carro: 2800, moto: 1000 }, // Valores en COP por hora
        tipos_vehiculo_permitidos: ['carro', 'moto']
    },
    {
        nombre_zona: 'Piso 2 - Larga Estancia',
        id_sede: sedeIds[2],
        capacidad_maxima: 70,
        cupos_disponibles: 60,
        tarifas: { carro: 2500, camioneta: 3500 }, // Valores en COP por hora
        tipos_vehiculo_permitidos: ['carro', 'camioneta']
    },
    {
        nombre_zona: 'Parqueadero de Motos',
        id_sede: sedeIds[2],
        capacidad_maxima: 40,
        cupos_disponibles: 38,
        tarifas: { moto: 900 }, // Valores en COP por hora
        tipos_vehiculo_permitidos: ['moto']
    },
    {
        nombre_zona: 'Parqueadero de Bicicletas',
        id_sede: sedeIds[2],
        capacidad_maxima: 35,
        cupos_disponibles: 30,
        tarifas: { bicicleta: 350 }, // Valores en COP por hora
        tipos_vehiculo_permitidos: ['bicicleta']
    },
    {
        nombre_zona: 'Zona Premium',
        id_sede: sedeIds[2],
        capacidad_maxima: 12,
        cupos_disponibles: 10,
        tarifas: { carro: 4500, camioneta: 5500 }, // Valores en COP por hora
        tipos_vehiculo_permitidos: ['carro', 'camioneta']
    }
);

db.zonas.insertMany(zonas);
print(`Insertadas ${zonas.length} zonas.`);

const zonaIds = db.zonas.find().map(z => z._id);

// --- 3. Insertar Usuarios (Empleados y Clientes) ---
const usuarios = [];
const empleadoSedes = [
    { email: 'carlos.r@bogota.com', id_sede_asignada: sedeIds[0] },
    { email: 'laura.p@bogota.com', id_sede_asignada: sedeIds[0] },
    { email: 'juan.c@medellin.com', id_sede_asignada: sedeIds[1] },
    { email: 'maria.s@medellin.com', id_sede_asignada: sedeIds[1] },
    { email: 'pedro.g@cali.com', id_sede_asignada: sedeIds[2] },
    { email: 'ana.m@cali.com', id_sede_asignada: sedeIds[2] },
    { email: 'luisa.f@bogota.com', id_sede_asignada: sedeIds[0] },
    { email: 'david.o@medellin.com', id_sede_asignada: sedeIds[1] },
    { email: 'sofia.v@cali.com', id_sede_asignada: sedeIds[2] },
    { email: 'jorge.l@bogota.com', id_sede_asignada: sedeIds[0] }
];

empleadoSedes.forEach((emp, i) => {
    usuarios.push({
        tipo_usuario: 'Empleado',
        nombre: `Empleado ${i + 1}`,
        apellido: `Apellido ${i + 1}`,
        email: emp.email,
        password: `hashed_pass_emp${i + 1}`, // Contraseña de prueba, se hashearía en real
        cedula: `100${i}00${i}00`,
        telefono: `30010020${i}`,
        direccion: `Calle Empleado ${i}`
    });
});

const clientesData = [
    { nombre: 'Andrea', apellido: 'Gomez', email: 'andrea.g@mail.com' },
    { nombre: 'Ricardo', apellido: 'Lopez', email: 'ricardo.l@mail.com' },
    { nombre: 'Isabel', apellido: 'Martinez', email: 'isabel.m@mail.com' },
    { nombre: 'Fernando', apellido: 'Diaz', email: 'fernando.d@mail.com' },
    { nombre: 'Laura', apellido: 'Ramirez', email: 'laura.r@mail.com' },
    { nombre: 'Diego', apellido: 'Sanchez', email: 'diego.s@mail.com' },
    { nombre: 'Valentina', apellido: 'Perez', email: 'valentina.p@mail.com' },
    { nombre: 'Carlos', apellido: 'Roa', email: 'carlos.roa@mail.com' },
    { nombre: 'Maria', apellido: 'Vargas', email: 'maria.v@mail.com' },
    { nombre: 'Pablo', apellido: 'Castillo', email: 'pablo.c@mail.com' },
    { nombre: 'Sofia', apellido: 'Herrera', email: 'sofia.h@mail.com' },
    { nombre: 'Daniel', apellido: 'Jimenez', email: 'daniel.j@mail.com' },
    { nombre: 'Camila', apellido: 'Moreno', email: 'camila.m@mail.com' },
    { nombre: 'Alejandro', apellido: 'Ruiz', email: 'alejandro.r@mail.com' },
    { nombre: 'Luisa', apellido: 'Torres', email: 'luisa.t@mail.com' }
];

clientesData.forEach((cli, i) => {
    usuarios.push({
        tipo_usuario: 'Cliente',
        nombre: cli.nombre,
        apellido: cli.apellido,
        email: cli.email,
        password: `hashed_pass_${cli.nombre.toLowerCase().charAt(0)}`, // Contraseña de prueba
        cedula: `200${i}00${i}00`,
        telefono: `31030040${i}`,
        direccion: `Avenida Cliente ${i}`
    });
});

db.usuarios.insertMany(usuarios);
print(`Insertados ${usuarios.length} usuarios (empleados y clientes).`);

const clienteIds = db.usuarios.find({ tipo_usuario: 'Cliente' }).map(u => u._id);

// --- 4. Insertar Vehículos ---
const vehiculos = [];
const tiposVehiculo = ['carro', 'moto', 'bicicleta', 'camioneta'];
const marcas = {
    carro: ['Toyota', 'Renault', 'Chevrolet', 'Mazda'],
    moto: ['Yamaha', 'Suzuki', 'Honda', 'Kawasaki'],
    bicicleta: ['Specialized', 'Scott', 'Trek'],
    camioneta: ['Ford', 'Nissan', 'Chevrolet']
};
const modelos = {
    Toyota: ['Corolla', 'Hilux'], Renault: ['Logan', 'Sandero'], Chevrolet: ['Spark', 'Tracker', 'Colorado'], Mazda: ['CX-5', '3'],
    Yamaha: ['FZ', 'MT'], Suzuki: ['GSX', 'V-Strom'], Honda: ['CB', 'XR'], Kawasaki: ['Ninja'],
    Specialized: ['Epic', 'Stumpjumper'], Scott: ['Scale', 'Spark'], Trek: ['Marlin', 'Fuel'],
    Ford: ['Ranger', 'F-150'], Nissan: ['Frontier'],
};

for (let i = 0; i < 30; i++) {
    const tipo = tiposVehiculo[Math.floor(Math.random() * tiposVehiculo.length)];
    const marca = marcas[tipo][Math.floor(Math.random() * marcas[tipo].length)];
    const modelo = modelos[marca][Math.floor(Math.random() * modelos[marca].length)];
    const idPropietario = clienteIds[Math.floor(Math.random() * clienteIds.length)];

    vehiculos.push({
        placa: `ABC${Math.floor(100 + Math.random() * 900)}`,
        tipo_vehiculo: tipo,
        marca: marca,
        modelo: modelo,
        color: (i % 3 == 0) ? 'Negro' : (i % 3 == 1) ? 'Blanco' : 'Gris',
        id_propietario: idPropietario
    });
}
db.vehiculos.insertMany(vehiculos);
print(`Insertados ${vehiculos.length} vehículos.`);

const vehiculoIds = db.vehiculos.find().map(v => v._id);

// --- 5. Insertar Parqueos ---
const parqueos = [];
const now = new Date(); // Fecha actual del sistema

// Helper para obtener zona compatible con tipo de vehículo
function getZonaCompatible(sedeId, tipoVehiculo) {
    const zonasCompatibles = db.zonas.find({
        id_sede: sedeId,
        tipos_vehiculo_permitidos: tipoVehiculo,
        cupos_disponibles: { $gt: 0 } // Solo zonas con cupos
    }).toArray();

    if (zonasCompatibles.length === 0) {
        return null;
    }
    return zonasCompatibles[Math.floor(Math.random() * zonasCompatibles.length)];
}

// Generar parqueos (activos y finalizados)
for (let i = 0; i < 50; i++) {
    const vehiculo = db.vehiculos.findOne({ _id: vehiculoIds[Math.floor(Math.random() * vehiculoIds.length)] });
    const tipoVehiculo = vehiculo.tipo_vehiculo;
    const sedeAleatoria = sedeIds[Math.floor(Math.random() * sedeIds.length)];
    const zona = getZonaCompatible(sedeAleatoria, tipoVehiculo);

    if (!zona) {
        // print(`Skipping parkeo for vehicle ${vehiculo.placa} due to no compatible zone with available capacity in sede ${sedeAleatoria}.`);
        continue; // Saltar si no hay zona compatible con cupos
    }

    const horaEntrada = new Date(now.getTime() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000) - (Math.random() * 60 * 60 * 1000)); // Últimos 30 días
    const estado = Math.random() < 0.7 ? 'finalizado' : 'activo'; // 70% finalizado, 30% activo

    let horaSalida = null;
    let tiempoTotalMinutos = null;
    let costoTotal = null;

    if (estado === 'finalizado') {
        const duracionHoras = Math.random() * 10 + 0.5; // Entre 0.5 y 10.5 horas
        horaSalida = new Date(horaEntrada.getTime() + duracionHoras * 60 * 60 * 1000);
        tiempoTotalMinutos = Math.round(duracionHoras * 60);

        // Calcular costo total
        const tarifaPorMinuto = zona.tarifas[tipoVehiculo] / 60; // Tarifa por minuto en COP
        costoTotal = Math.round(tarifaPorMinuto * tiempoTotalMinutos);
        costoTotal = Math.max(costoTotal, zona.tarifas[tipoVehiculo]); // Asegura un mínimo de una hora
    }

    parqueos.push({
        id_vehiculo: vehiculo._id,
        id_sede: sedeAleatoria,
        id_zona: zona._id,
        hora_entrada: horaEntrada,
        hora_salida: horaSalida,
        tiempo_total_minutos: tiempoTotalMinutos,
        costo_total: costoTotal, // Valor en Pesos Colombianos (COP)
        estado: estado
    });

    // Disminuir cupos disponibles para parqueos activos
    if (estado === 'activo') {
        db.zonas.updateOne(
            { _id: zona._id, cupos_disponibles: { $gt: 0 } },
            { $inc: { cupos_disponibles: -1 } }
        );
    }
}

db.parqueos.insertMany(parqueos);
print(`Insertados ${parqueos.length} parqueos (activos y finalizados).`);

print("\n--- Datos de prueba insertados exitosamente. ---");