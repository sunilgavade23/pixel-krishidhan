const DEFAULT_RENT_RATE = {
    hour: 600,
    acre: 1400,
};

export const OWNER_PRICED_RENT_CATEGORIES = new Set([
    'aerial_digital_agri_tech',
    'advanced_harvesting_machinery',
    'precision_land_preparation_planting',
    'orchard_high_value_crop_equipment',
    'post_harvest_processing_infrastructure',
]);

export const LOGISTICS_RATE_PER_KM = 25;
export const PLATFORM_FEE_RATE = 0.05;

export const RENT_RATE_CARD = {
    harvester: { acre: 1700 },
    tools: { acre: 1500 },
    blower: { liter: 10, minLiter: 100 },
    trolly: { distance: 60 },
    sowing_machine: { kg: 180 },
    thresing_machine: { ton: 2000, quintal: 200 },
    rotar: { acre: 1200, hour: 900 },
    aerial_digital_agri_tech: { day: 0 },
    advanced_harvesting_machinery: { day: 0 },
    precision_land_preparation_planting: { day: 0 },
    orchard_high_value_crop_equipment: { day: 0 },
    post_harvest_processing_infrastructure: { day: 0 },
};

export const CATEGORY_LABELS = {
    tractor: 'Tractor',
    harvester: 'Harvester',
    tools: 'Farming Tools',
    blower: 'Blower',
    trolly: 'Trolly',
    sowing_machine: 'Sowing Machine',
    thresing_machine: 'Thresing Machine',
    rotar: 'Rotar',
    aerial_digital_agri_tech: 'Aerial & Digital Agriculture Tech',
    advanced_harvesting_machinery: 'Advanced Harvesting Machinery',
    precision_land_preparation_planting: 'Precision Land Preparation & Planting Machines',
    orchard_high_value_crop_equipment: 'Orchard & High-Value Crop Equipment',
    post_harvest_processing_infrastructure: 'Post-Harvest & Processing Infrastructure',
};

export const RENT_ALLOWED_UNITS = {
    harvester: ['acre'],
    tools: ['acre'],
    blower: ['liter'],
    trolly: ['distance'],
    sowing_machine: ['kg'],
    thresing_machine: ['ton', 'quintal'],
    rotar: ['acre', 'hour'],
    aerial_digital_agri_tech: ['day'],
    advanced_harvesting_machinery: ['day'],
    precision_land_preparation_planting: ['day'],
    orchard_high_value_crop_equipment: ['day'],
    post_harvest_processing_infrastructure: ['day'],
};

export function getRentRateByCategory(category) {
    const key = String(category || '').trim().toLowerCase();
    return RENT_RATE_CARD[key] || DEFAULT_RENT_RATE;
}

export function getAllowedRentUnits(category) {
    const key = String(category || '').trim().toLowerCase();
    return RENT_ALLOWED_UNITS[key] || ['hour', 'acre'];
}

export function isOwnerPricedRentCategory(category) {
    const key = String(category || '').trim().toLowerCase();
    return OWNER_PRICED_RENT_CATEGORIES.has(key);
}
