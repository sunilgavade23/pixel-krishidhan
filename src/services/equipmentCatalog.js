export const EQUIPMENT_BY_CATEGORY = {
    aerial_digital_agri_tech: [
        'Agriculture Spraying Drones (Hexacopters)',
        'Multispectral Crop Sensors',
    ],
    advanced_harvesting_machinery: [
        'Self-Propelled Sugarcane Harvesters',
        'Track-Type Combine Harvesters',
        'Silage Baler and Wrappers',
    ],
    precision_land_preparation_planting: [
        'Laser Land Levellers',
        'Pneumatic Precision Planters',
        'Super Seeders',
    ],
    orchard_high_value_crop_equipment: [
        'Tractor-Mounted Air-Blast Sprayers',
        'Hydraulic Tree Pruning Platforms',
        'Self-Propelled Forage Choppers',
    ],
    post_harvest_processing_infrastructure: [
        'Mobile Grain Dryers',
        'Optical Color Sorters',
        'Solar-Powered Micro Cold Storage Units',
    ],
};

export function getEquipmentByCategory(category) {
    const key = String(category || '').trim().toLowerCase();
    return EQUIPMENT_BY_CATEGORY[key] || [];
}

