import { supabase } from "@/lib/supabase";

export const createSampleManualSections = async (propertyId: string) => {
  const sampleSections = [
    {
      title: "Smart TV & Entertainment System",
      description: "Complete guide to operating all entertainment devices including TV, sound system, and streaming devices.",
      icon: "📺",
      order_index: 1,
      property_id: propertyId,
      items: [
        {
          title: "How to Turn On the TV",
          content: `1. Locate the TV remote on the coffee table
2. Press the red power button at the top of the remote
3. Wait 3-5 seconds for the TV to fully boot up
4. The TV should display the home screen

If the TV doesn't turn on:
- Check that it's plugged into the wall outlet
- Try pressing the power button on the TV itself (located on the bottom right)
- Replace the remote batteries if needed`,
          media_urls: [],
          order_index: 1,
          important: true,
        },
        {
          title: "Connecting to Netflix",
          content: `1. Press the Netflix button on the remote (red button with Netflix logo)
2. If prompted, sign in with your Netflix account
3. Browse and select what you'd like to watch
4. Use the arrow buttons to navigate and OK button to select

Note: The TV is already connected to high-speed WiFi, so streaming should be smooth.`,
          media_urls: [],
          order_index: 2,
          important: false,
        },
      ],
    },
    {
      title: "Hot Tub Operation & Safety",
      description: "Step-by-step instructions for safely operating and enjoying the hot tub, including temperature controls and safety guidelines.",
      icon: "🏊‍♂️",
      order_index: 2,
      property_id: propertyId,
      items: [
        {
          title: "Starting the Hot Tub",
          content: `1. Locate the hot tub control panel (next to the steps)
2. Press the "Power" button to turn on the system
3. Set temperature using the up/down arrows (recommended: 102°F)
4. Press "Jets" button to activate bubbles
5. Allow 15-20 minutes to reach desired temperature

Safety reminders:
- Maximum occupancy: 6 people
- Maximum session: 15-20 minutes
- Stay hydrated - drink water while soaking`,
          media_urls: [],
          order_index: 1,
          important: true,
        },
        {
          title: "Hot Tub Safety Rules",
          content: `Important safety guidelines:

• No glass containers in or around hot tub
• Shower before entering to remove oils and lotions
• No diving or jumping
• Children must be supervised at all times
• Exit immediately if you feel dizzy or overheated
• Keep hot tub cover closed when not in use
• Do not use if you have heart conditions or are pregnant

Emergency: Hot tub shut-off switch is located on the side of the house near the electrical panel.`,
          media_urls: [],
          order_index: 2,
          important: true,
        },
      ],
    },
    {
      title: "Kitchen Appliances Guide",
      description: "Instructions for all major kitchen appliances including coffee maker, dishwasher, and cooking equipment.",
      icon: "🍽️",
      order_index: 3,
      property_id: propertyId,
      items: [
        {
          title: "Using the Coffee Maker",
          content: `1. Fill the water reservoir with fresh water (located at back)
2. Place a coffee filter in the basket
3. Add 1 tablespoon of ground coffee per cup of water
4. Press the power button - the red light will indicate it's brewing
5. Coffee will be ready in 3-5 minutes

Coffee and filters are provided in the cabinet above the coffee maker.`,
          media_urls: [],
          order_index: 1,
          important: false,
        },
        {
          title: "Dishwasher Instructions",
          content: `1. Scrape food debris from dishes (no need to rinse)
2. Load dishes with dirty surfaces facing spray arms
3. Add detergent pod to the dispenser door
4. Select "Normal" cycle for most loads
5. Press "Start" button

Dishwasher pods are located under the kitchen sink. Please start the dishwasher before checkout.`,
          media_urls: [],
          order_index: 2,
          important: false,
        },
      ],
    },
    {
      title: "WiFi & Internet Access",
      description: "Network information and troubleshooting guide for internet connectivity throughout the property.",
      icon: "📶",
      order_index: 4,
      property_id: propertyId,
      items: [
        {
          title: "Connecting to WiFi",
          content: `Network Name: PropertyGuest_5G
Password: Welcome2024!

1. Open WiFi settings on your device
2. Select "PropertyGuest_5G" from available networks
3. Enter the password when prompted
4. You should connect automatically

For smart TVs and streaming devices, use the same network and password.

Internet speed: 500+ Mbps - perfect for streaming and video calls.`,
          media_urls: [],
          order_index: 1,
          important: true,
        },
      ],
    },
    {
      title: "Emergency Information",
      description: "Important safety information, emergency contacts, and procedures for your stay.",
      icon: "🚨",
      order_index: 5,
      property_id: propertyId,
      items: [
        {
          title: "Emergency Contacts",
          content: `🚨 EMERGENCY (Fire, Medical, Police): 911

📞 Property Manager: (555) 123-4567
Available 24/7 for urgent property issues

🔧 Maintenance Issues: (555) 123-4568
For non-emergency repairs (broken appliances, plumbing, etc.)

🏥 Nearest Hospital: City General Hospital
123 Main Street (5 minutes away)

🚓 Local Police: (555) 911-1234
Non-emergency line`,
          media_urls: [],
          order_index: 1,
          important: true,
        },
        {
          title: "Fire Safety & Exits",
          content: `🔥 Fire Extinguisher Locations:
• Kitchen (under sink)
• Garage (by door)
• Master bedroom (in closet)

🚪 Emergency Exits:
• Front door (main exit)
• Back patio door
• Garage door

💨 Smoke Detectors:
Located in all bedrooms and hallways. If alarm sounds, evacuate immediately and call 911.

🔑 Spare Key:
Hidden lockbox by front door (code provided separately)`,
          media_urls: [],
          order_index: 2,
          important: true,
        },
      ],
    },
  ];

  try {
    // Insert sections first
    const { data: sectionsData, error: sectionsError } = await supabase
      .from("manual_sections")
      .insert(
        sampleSections.map(({ items, ...section }) => section)
      )
      .select();

    if (sectionsError) throw sectionsError;

    // Insert items for each section
    for (let i = 0; i < sectionsData.length; i++) {
      const section = sectionsData[i];
      const sampleItems = sampleSections[i].items;

      if (sampleItems.length > 0) {
        const itemsToInsert = sampleItems.map(item => ({
          ...item,
          section_id: section.id,
        }));

        const { error: itemsError } = await supabase
          .from("manual_items")
          .insert(itemsToInsert);

        if (itemsError) {
          console.error(`Error inserting items for section ${section.title}:`, itemsError);
        }
      }
    }

    console.log(`✅ Created ${sectionsData.length} sample manual sections for property ${propertyId}`);
    return sectionsData;

  } catch (error) {
    console.error("Error creating sample manual sections:", error);
    throw error;
  }
};