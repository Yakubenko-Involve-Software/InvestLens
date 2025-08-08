const allRoutesData = [
  { "id":"A","name":"Miguel Silva","stops":11,"km":35,"risk":"High" },
  { "id":"B","name":"Inês Ramos","stops":10,"km":32,"risk":"Low" },
  { "id":"C","name":"João Costa","stops":12,"km":38,"risk":"Med" },
  { "id":"D","name":"Ana Pereira","stops":9,"km":28,"risk":"Low" },
  { "id":"E","name":"Rui Almeida","stops":14,"km":45,"risk":"High" },
  { "id":"F","name":"Sofia Santos","stops":11,"km":36,"risk":"Med" },
  { "id":"G","name":"Pedro Ferreira","stops":13,"km":41,"risk":"High" },
  { "id":"H","name":"Catarina Martins","stops":10,"km":31,"risk":"Low" },
  { "id":"I","name":"André Sousa","stops":12,"km":39,"risk":"Med" },
  { "id":"J","name":"Mariana Rodrigues","stops":9,"km":29,"risk":"Low" },
  { "id":"K","name":"Tiago Gonçalves","stops":15,"km":50,"risk":"High" },
  { "id":"L","name":"Beatriz Lopes","stops":11,"km":34,"risk":"Med" },
  { "id":"M","name":"Diogo Mendes","stops":13,"km":42,"risk":"High" },
  { "id":"N","name":"Carolina Jesus","stops":10,"km":33,"risk":"Low" },
  { "id":"O","name":"Vasco Pinto","stops":12,"km":37,"risk":"Med" },
  { "id":"P","name":"Daniela Correia","stops":9,"km":27,"risk":"Low" },
  { "id":"Q","name":"Bruno Fernandes","stops":14,"km":48,"risk":"High" },
  { "id":"R","name":"Joana Ribeiro","stops":11,"km":35,"risk":"Med" },
  { "id":"S","name":"Ricardo Neves","stops":13,"km":43,"risk":"High" },
  { "id":"T","name":"Marta Cunha","stops":10,"km":30,"risk":"Low" },
  { "id":"U","name":"Fábio Moreira","stops":12,"km":40,"risk":"Med" },
  { "id":"V","name":"Soraia Tavares","stops":9,"km":26,"risk":"Low" },
  { "id":"W","name":"Jorge Dias","stops":14,"km":46,"risk":"High" },
  { "id":"X","name":"Lúcia Duarte","stops":11,"km":37,"risk":"Med" }
];

const allOrdersData = [];
const firstNames = ["Sofia", "Ricardo", "Carla", "Bruno", "Ana", "Miguel", "Teresa", "João", "Mariana", "Pedro", "Beatriz", "Diogo", "Carolina", "Vasco", "Daniela"];
const lastNames = ["Monteiro", "Lima", "Nogueira", "Ferreira", "Pereira", "Torres", "Silva", "Martins", "Lopes", "Gonçalves", "Jesus", "Pinto", "Correia", "Fernandes", "Ribeiro"];
const statuses = ["Packed", "Picking", "Delivered", "In Transit"];
const temps = ["COLD", "FRESH"];
const couriersSample = "ABCDEFGH".split('');
const slots = ["07–10", "09–12", "10–13", "11–14", "13–16", "14–17", "15–18", "16–19"];

for (let i = 1; i <= 150; i++) {
    const customerName = `${firstNames[i % firstNames.length]} ${lastNames[(i + 5) % lastNames.length]}`;
    const slot = slots[i % slots.length];
    const hour = parseInt(slot.split('–')[0]) + (i % 3);
    const minute = (i * 15) % 60;
    const eta = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    
    allOrdersData.push({
        orderId: `FC-${12000 + i}`,
        customer: customerName,
        address: `Address line ${i}`,
        slot: slot,
        eta: eta,
        temp: temps[i % temps.length],
        status: statuses[i % statuses.length],
        courier: i % 5 === 0 ? "Unassigned" : couriersSample[i % couriersSample.length]
    });
}

const summaryBaseData = {
 "routesOptimised":3,
 "stopsMerged":2,
 "callsScheduled":1,
 "timeSavedMin":42,
 "successDelta":7.2,
 "spoilageDelta":-0.8,
 "effGainPct":15
};

const stopsDataAll = {};

// Hardcode routes A, B, C for the live map example to be small and not overlap
stopsDataAll['A'] = [
    {id: 1, eta: "08:00", addr: "Campo Grande", lat: 38.755, lon: -9.155},
    {id: 2, eta: "08:15", addr: "Entrecampos", lat: 38.748, lon: -9.148},
    {id: 3, eta: "08:30", addr: "Saldanha", lat: 38.735, lon: -9.145},
    {id: 4, eta: "08:45", addr: "Picoas", lat: 38.729, lon: -9.148},
    {id: 5, eta: "09:00", addr: "Campo Grande", lat: 38.755, lon: -9.155}
];

stopsDataAll['B'] = [
    {id: 1, eta: "08:00", addr: "Marquês de Pombal", lat: 38.725, lon: -9.150},
    {id: 2, eta: "08:15", addr: "Parque Eduardo VII", lat: 38.730, lon: -9.155},
    {id: 3, eta: "08:30", addr: "Amoreiras", lat: 38.724, lon: -9.163},
    {id: 4, eta: "08:45", addr: "Rato", lat: 38.719, lon: -9.156},
    {id: 5, eta: "09:00", addr: "Marquês de Pombal", lat: 38.725, lon: -9.150}
];

stopsDataAll['C'] = [
    {id: 1, eta: "08:00", addr: "Alfama", lat: 38.712, lon: -9.130},
    {id: 2, eta: "08:15", addr: "Graça", lat: 38.717, lon: -9.131},
    {id: 3, eta: "08:30", addr: "Anjos", lat: 38.725, lon: -9.135},
    {id: 4, eta: "08:45", addr: "Arroios", lat: 38.730, lon: -9.137},
    {id: 5, eta: "09:00", addr: "Alfama", lat: 38.712, lon: -9.130}
];

// Missed deliveries data
const missedDeliveriesData = [
    { orderId: "12847", customer: "Maria Santos", courier: "Miguel Silva", scheduled: "14:30", missedBy: "2h 15m", reason: "Traffic delay", status: "Rescheduled" },
    { orderId: "12843", customer: "João Pereira", courier: "Ana Pereira", scheduled: "11:00", missedBy: "1h 45m", reason: "Customer unavailable", status: "Failed" },
    { orderId: "12839", customer: "Carlos Silva", courier: "Sofia Santos", scheduled: "16:15", missedBy: "1h 32m", reason: "Vehicle breakdown", status: "Reassigned" },
    { orderId: "12835", customer: "Patricia Costa", courier: "Pedro Ferreira", scheduled: "09:45", missedBy: "1h 20m", reason: "Wrong address", status: "Delivered" },
    { orderId: "12831", customer: "Roberto Lima", courier: "Inês Ramos", scheduled: "13:20", missedBy: "1h 18m", reason: "GPS malfunction", status: "Rescheduled" },
    { orderId: "12828", customer: "Luisa Fernandes", courier: "Rui Almeida", scheduled: "15:40", missedBy: "1h 12m", reason: "Temperature issue", status: "Failed" },
    { orderId: "12824", customer: "Fernando Gomes", courier: "João Costa", scheduled: "10:30", missedBy: "1h 08m", reason: "Road closure", status: "Delivered" },
    { orderId: "12820", customer: "Sandra Oliveira", courier: "Catarina Martins", scheduled: "12:15", missedBy: "1h 05m", reason: "Package damage", status: "Failed" },
    { orderId: "12816", customer: "Miguel Torres", courier: "André Sousa", scheduled: "17:20", missedBy: "58m", reason: "Customer not home", status: "Rescheduled" },
    { orderId: "12812", customer: "Ana Barbosa", courier: "Mariana Rodrigues", scheduled: "14:45", missedBy: "55m", reason: "Parking issues", status: "Delivered" },
    { orderId: "12808", customer: "Ricardo Mendes", courier: "Tiago Gonçalves", scheduled: "11:30", missedBy: "52m", reason: "Building access", status: "Rescheduled" },
    { orderId: "12804", customer: "Teresa Silva", courier: "Beatriz Lopes", scheduled: "16:00", missedBy: "48m", reason: "Weather delay", status: "Delivered" },
    { orderId: "12800", customer: "Paulo Rodrigues", courier: "Diogo Mendes", scheduled: "08:15", missedBy: "45m", reason: "System error", status: "Failed" },
    { orderId: "12796", customer: "Isabel Costa", courier: "Carolina Jesus", scheduled: "13:50", missedBy: "42m", reason: "Fuel shortage", status: "Reassigned" },
    { orderId: "12792", customer: "Mário Lopes", courier: "Vasco Pinto", scheduled: "15:25", missedBy: "40m", reason: "Late departure", status: "Delivered" },
    { orderId: "12788", customer: "Helena Martins", courier: "Daniela Correia", scheduled: "12:30", missedBy: "38m", reason: "Address change", status: "Rescheduled" },
    { orderId: "12784", customer: "António Silva", courier: "Jorge Dias", scheduled: "14:20", missedBy: "35m", reason: "Traffic accident", status: "Failed" },
    { orderId: "12780", customer: "Carla Santos", courier: "Lúcia Duarte", scheduled: "16:45", missedBy: "32m", reason: "Customer request", status: "Delivered" },
    { orderId: "12776", customer: "Manuel Costa", courier: "Bruno Fernandes", scheduled: "10:15", missedBy: "30m", reason: "Vehicle maintenance", status: "Reassigned" },
    { orderId: "12772", customer: "Sofia Lima", courier: "Joana Ribeiro", scheduled: "13:10", missedBy: "28m", reason: "Weather conditions", status: "Delivered" }
];


const couriers = "ABCDEFGHIJKLMNOPQRSTUVWX".split('');
const sampleAddresses = [
    { addr: "Main Street 123", lat: 38.71, lon: -9.14 },
    { addr: "Oak Avenue 45", lat: 38.72, lon: -9.15 },
    { addr: "Pine Lane 7", lat: 38.73, lon: -9.16 },
    { addr: "Elm Court 89", lat: 38.74, lon: -9.12 },
    { addr: "Cedar Blvd 101", lat: 38.70, lon: -9.11 },
];

couriers.forEach((courierId, index) => {
    if (stopsDataAll[courierId]) {
        return; // Skip A, B, C as they are already defined
    }
    const numStops = 8 + (index % 5); // 8 to 12 stops
    const stops = [];
    stops.push({"id":1, "eta": "08:00", "addr": "Warehouse Alvalade","lat":38.758,"lon":-9.139});
    for (let i = 1; i <= numStops; i++) {
        const address = sampleAddresses[(index + i) % sampleAddresses.length];
        const hour = 8 + i;
        const minute = (i * 15) % 60;
        stops.push({
            "id": i + 1,
            "eta": `${String(hour).padStart(2,'0')}:${String(minute).padStart(2, '0')}`,
            ...address
        });
    }
    stops.push({"id":numStops + 2, "eta": `${String(8 + numStops + 1).padStart(2,'0')}:00`, "addr": "Warehouse Alvalade","lat":38.758,"lon":-9.139});
    stopsDataAll[courierId] = stops;
}); 