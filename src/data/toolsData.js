// Master database for all agricultural equipment available in the app
export const toolsData = [
    // --- Land Preparation Equipment ---
    {
        id: 'lp-01',
        name: "Rotavator (Rotary Tiller)",
        category: "Land Preparation",
        localName: "Rotavator",
        image: "https://images.unsplash.com/photo-1594494818244-a416d0399a0c?q=80&w=600&auto=format&fit=crop"
    },
    {
        id: 'lp-02',
        name: "Mould Board (MB) Plough",
        category: "Land Preparation",
        localName: "Nangar (Plough)",
        image: "https://tiimg.tistatic.com/fp/1/007/574/mild-steel-hydraulic-reversible-plough-for-agriculture-usage-767.jpg"
    },
    {
        id: 'lp-03',
        name: "Cultivator",
        category: "Land Preparation",
        localName: "Cultivator (Pali)",
        image: "https://5.imimg.com/data5/SELLER/Default/2022/9/VK/VP/QO/4636906/agriculture-cultivator.jpg"
    },

    // --- Sowing & Planting Equipment ---
    {
        id: 'sp-01',
        name: "Seed-cum-Fertilizer Drill",
        category: "Sowing",
        localName: "Perani Yantra (Pabhari)",
        image: "https://5.imimg.com/data5/SELLER/Default/2023/1/YV/WO/HU/3618487/seed-cum-fertilizer-drill-500x500.png"
    },

    // --- Harvesting Equipment ---
    {
        id: 'hv-01',
        name: "Combine Harvester",
        category: "Harvesting",
        localName: "Harvester",
        image: "https://5.imimg.com/data5/SELLER/Default/2022/5/II/VM/WO/2662078/kartar-4000-combine-harvester-500x500.jpg"
    },

    // --- Transport Equipment ---
    {
        id: 'tr-01',
        name: "Hydraulic Trolley",
        category: "Transport",
        localName: "Tractor Trolley",
        image: "https://5.imimg.com/data5/SELLER/Default/2021/1/UP/QL/UT/2464971/tractor-trolley-500x500.jpg"
    }
];

// Utility function to fetch tools based on their category
export const getToolsByCategory = (category) => {
    return toolsData.filter(tool => tool.category === category);
};