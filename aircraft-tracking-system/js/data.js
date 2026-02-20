// ============================================================
//  MOCK DATA – Aircraft Tracking & Maintenance System
// ============================================================

const DB = {
    aircraft: [
        { id: 'A001', registration: 'N737BA', model: 'Boeing 737-800', airline: 'SkyLine Airways', type: 'Narrow-body', status: 'active', flightHours: 12450, lastMaintenance: '2026-01-15', nextMaintenance: '2026-03-01', cycles: 4820, manufacture: 2018, engines: 2, seats: 162, image: null, notes: 'Engine 2 inspection due at next service.' },
        { id: 'A002', registration: 'N787UA', model: 'Boeing 787-9', airline: 'Pacific Air', type: 'Wide-body', status: 'active', flightHours: 8230, lastMaintenance: '2026-01-28', nextMaintenance: '2026-04-15', cycles: 2140, manufacture: 2020, engines: 2, seats: 296, image: null, notes: '' },
        { id: 'A003', registration: 'N320AA', model: 'Airbus A320neo', airline: 'SkyLine Airways', type: 'Narrow-body', status: 'maintenance', flightHours: 9870, lastMaintenance: '2026-02-10', nextMaintenance: '2026-02-28', cycles: 3560, manufacture: 2019, engines: 2, seats: 180, image: null, notes: 'C-Check in progress.' },
        { id: 'A004', registration: 'N380QA', model: 'Airbus A380', airline: 'Global Air', type: 'Wide-body', status: 'active', flightHours: 18900, lastMaintenance: '2025-12-20', nextMaintenance: '2026-02-22', cycles: 5200, manufacture: 2016, engines: 4, seats: 555, image: null, notes: 'APU replacement scheduled.' },
        { id: 'A005', registration: 'N777WA', model: 'Boeing 777-300ER', airline: 'Pacific Air', type: 'Wide-body', status: 'grounded', flightHours: 22100, lastMaintenance: '2026-02-01', nextMaintenance: '2026-02-21', cycles: 7800, manufacture: 2014, engines: 2, seats: 396, image: null, notes: 'Grounded – hydraulic system fault.' },
        { id: 'A006', registration: 'N350GA', model: 'Airbus A350-900', airline: 'Global Air', type: 'Wide-body', status: 'active', flightHours: 6520, lastMaintenance: '2026-02-05', nextMaintenance: '2026-05-10', cycles: 1890, manufacture: 2022, engines: 2, seats: 325, image: null, notes: '' },
        { id: 'A007', registration: 'N190CA', model: 'Embraer E190', airline: 'City Hops', type: 'Regional', status: 'active', flightHours: 4300, lastMaintenance: '2026-01-20', nextMaintenance: '2026-03-20', cycles: 6100, manufacture: 2021, engines: 2, seats: 98, image: null, notes: '' },
        { id: 'A008', registration: 'N220CA', model: 'ATR 72-600', airline: 'City Hops', type: 'Regional', status: 'maintenance', flightHours: 7650, lastMaintenance: '2026-02-12', nextMaintenance: '2026-03-01', cycles: 9200, manufacture: 2017, engines: 2, seats: 70, image: null, notes: 'Landing gear overhaul.' },
    ],

    flights: [
        { id: 'F001', aircraftId: 'A001', flightNo: 'SK101', origin: 'JFK', dest: 'LHR', status: 'en-route', altitude: 38000, speed: 548, heading: 50, lat: 52.3, lng: -20.1, depTime: '06:30', arrTime: '18:45', progress: 62 },
        { id: 'F002', aircraftId: 'A002', flightNo: 'PA210', origin: 'LAX', dest: 'SYD', status: 'en-route', altitude: 41000, speed: 572, heading: 220, lat: -15.6, lng: 165.2, depTime: '08:00', arrTime: '16:30+1', progress: 78 },
        { id: 'F003', aircraftId: 'A004', flightNo: 'GA450', origin: 'DXB', dest: 'JFK', status: 'en-route', altitude: 37000, speed: 541, heading: 310, lat: 42.1, lng: 35.8, depTime: '02:15', arrTime: '11:00', progress: 45 },
        { id: 'F004', aircraftId: 'A006', flightNo: 'GA320', origin: 'CDG', dest: 'SGN', status: 'en-route', altitude: 40000, speed: 563, heading: 125, lat: 20.5, lng: 90.3, depTime: '10:00', arrTime: '23:55', progress: 55 },
        { id: 'F005', aircraftId: 'A007', flightNo: 'CH505', origin: 'BOM', dest: 'DEL', status: 'en-route', altitude: 28000, speed: 485, heading: 335, lat: 22.7, lng: 75.8, depTime: '14:10', arrTime: '15:50', progress: 40 },
    ],

    maintenance: [
        { id: 'M001', aircraftId: 'A003', type: 'C-Check', description: 'Full structural inspection and component overhaul', status: 'in-progress', priority: 'high', technician: 'James Kolter', hangar: 'Bay 3', startDate: '2026-02-10', dueDate: '2026-02-28', estimatedHours: 120, completedHours: 80, cost: 85000 },
        { id: 'M002', aircraftId: 'A008', type: 'Landing Gear Overhaul', description: 'Complete landing gear disassembly, inspection and re-assembly', status: 'in-progress', priority: 'high', technician: 'Sarah Chen', hangar: 'Bay 7', startDate: '2026-02-12', dueDate: '2026-03-01', estimatedHours: 60, completedHours: 20, cost: 42000 },
        { id: 'M003', aircraftId: 'A004', type: 'APU Replacement', description: 'Replace Auxiliary Power Unit – unit end of life', status: 'scheduled', priority: 'medium', technician: 'Mike Patel', hangar: 'Bay 2', startDate: '2026-02-22', dueDate: '2026-02-25', estimatedHours: 24, completedHours: 0, cost: 28000 },
        { id: 'M004', aircraftId: 'A005', type: 'Hydraulic System', description: 'Diagnose and repair hydraulic system fault – aircraft grounded', status: 'scheduled', priority: 'critical', technician: 'Anna Reeves', hangar: 'Bay 1', startDate: '2026-02-21', dueDate: '2026-02-23', estimatedHours: 18, completedHours: 0, cost: 15000 },
        { id: 'M005', aircraftId: 'A001', type: 'A-Check', description: 'Routine A-Check – visual inspection and fluid top-up', status: 'scheduled', priority: 'low', technician: 'James Kolter', hangar: 'Bay 4', startDate: '2026-03-01', dueDate: '2026-03-02', estimatedHours: 8, completedHours: 0, cost: 5000 },
        { id: 'M006', aircraftId: 'A007', type: 'Engine Borescope', description: 'Borescope inspection of both CFM56 engines', status: 'scheduled', priority: 'medium', technician: 'Tom Walsh', hangar: 'Bay 5', startDate: '2026-03-20', dueDate: '2026-03-21', estimatedHours: 12, completedHours: 0, cost: 8500 },
        { id: 'M007', aircraftId: 'A002', type: 'B-Check', description: 'Detailed B-Check – systems inspection', status: 'completed', priority: 'medium', technician: 'Sarah Chen', hangar: 'Bay 6', startDate: '2026-01-20', dueDate: '2026-01-28', estimatedHours: 36, completedHours: 36, cost: 22000 },
        { id: 'M008', aircraftId: 'A006', type: 'A-Check', description: 'Routine A-Check', status: 'completed', priority: 'low', technician: 'Mike Patel', hangar: 'Bay 4', startDate: '2026-02-03', dueDate: '2026-02-05', estimatedHours: 8, completedHours: 8, cost: 5200 },
    ],

    parts: [
        { id: 'P001', partNo: 'CFM-56-7B-001', name: 'CFM56-7B Fan Blade Set', category: 'Engine', quantity: 4, reorderLevel: 2, unitCost: 12000, supplier: 'CFM International', leadDays: 45 },
        { id: 'P002', partNo: 'HYD-PUMP-B737', name: 'Hydraulic Pump 737', category: 'Hydraulics', quantity: 2, reorderLevel: 3, unitCost: 8500, supplier: 'Eaton Aerospace', leadDays: 30 },
        { id: 'P003', partNo: 'BRAKE-ASSY-A320', name: 'Carbon Brake Assembly A320', category: 'Landing Gear', quantity: 8, reorderLevel: 4, unitCost: 4200, supplier: 'Messier-Bugatti', leadDays: 20 },
        { id: 'P004', partNo: 'APU-GTCP36-150', name: 'APU GTCP36-150 Unit', category: 'APU', quantity: 1, reorderLevel: 1, unitCost: 280000, supplier: 'Honeywell', leadDays: 90 },
        { id: 'P005', partNo: 'AVIONICS-IRS-001', name: 'Inertial Reference System', category: 'Avionics', quantity: 3, reorderLevel: 2, unitCost: 75000, supplier: 'Honeywell', leadDays: 60 },
        { id: 'P006', partNo: 'SEAL-HYD-UNIV', name: 'Hydraulic Seal Kit (Universal)', category: 'Hydraulics', quantity: 25, reorderLevel: 10, unitCost: 350, supplier: 'Parker Hannifin', leadDays: 7 },
        { id: 'P007', partNo: 'TIRE-B777-MLG', name: 'Main Landing Gear Tire B777', category: 'Landing Gear', quantity: 6, reorderLevel: 8, unitCost: 2100, supplier: 'Michelin Aircraft', leadDays: 14 },
        { id: 'P008', partNo: 'FILTER-OIL-GEN', name: 'Engine Oil Filter (Generic)', category: 'Engine', quantity: 48, reorderLevel: 20, unitCost: 120, supplier: 'Pall Corporation', leadDays: 5 },
        { id: 'P009', partNo: 'PITOT-PROBE-001', name: 'Pitot Probe Assembly', category: 'Avionics', quantity: 2, reorderLevel: 4, unitCost: 1800, supplier: 'Thales', leadDays: 21 },
        { id: 'P010', partNo: 'OXYGEN-MASK-SET', name: 'Passenger Oxygen Mask Set (180p)', category: 'Cabin Safety', quantity: 5, reorderLevel: 3, unitCost: 3400, supplier: 'B/E Aerospace', leadDays: 10 },
    ],

    alerts: [
        { id: 'AL001', type: 'critical', icon: '🔴', title: 'Aircraft Grounded', message: 'N777WA grounded – hydraulic system fault. Immediate attention required.', time: '2h ago', read: false },
        { id: 'AL002', type: 'warning', icon: '🟡', title: 'Maintenance Overdue', message: 'N380QA APU replacement overdue by 2 days.', time: '4h ago', read: false },
        { id: 'AL003', type: 'warning', icon: '🟡', title: 'Low Parts Stock', message: 'Main Landing Gear Tire B777 (P007) below reorder level.', time: '6h ago', read: false },
        { id: 'AL004', type: 'warning', icon: '🟡', title: 'Low Parts Stock', message: 'Pitot Probe Assembly (P009) critically low stock.', time: '8h ago', read: false },
        { id: 'AL005', type: 'info', icon: '🔵', title: 'Maintenance Complete', message: 'B-Check on N787UA completed successfully.', time: '1d ago', read: true },
        { id: 'AL006', type: 'info', icon: '🔵', title: 'Flight Arrived', message: 'SK202 arrived at LHR – on time.', time: '2d ago', read: true },
    ],

    technicians: ['James Kolter', 'Sarah Chen', 'Mike Patel', 'Anna Reeves', 'Tom Walsh', 'Kevin Lam'],
    hangars: ['Bay 1', 'Bay 2', 'Bay 3', 'Bay 4', 'Bay 5', 'Bay 6', 'Bay 7'],
};

// Helpers
function getAircraft(id) { return DB.aircraft.find(a => a.id === id); }
function getActiveFlight(aircraftId) { return DB.flights.find(f => f.aircraftId === aircraftId); }
function getMaintenanceByAircraft(id) { return DB.maintenance.filter(m => m.aircraftId === id); }
function getUnreadAlerts() { return DB.alerts.filter(a => !a.read); }
function isLowStock(p) { return p.quantity <= p.reorderLevel; }
function daysUntil(dateStr) {
    const d = new Date(dateStr) - new Date();
    return Math.ceil(d / 86400000);
}
