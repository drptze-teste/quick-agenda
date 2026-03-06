import express from "express";
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.get("/api/data", async (req, res) => {
  try {
    const { data: settings } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 'default')
      .single();

    const { data: professionalsData } = await supabase
      .from('professionals')
      .select('*');

    const professionals = professionalsData?.map(p => ({
      id: p.id,
      name: p.name,
      slotConfig: p.slot_config || {}
    })) || [];

    const { data: schedulesData } = await supabase
      .from('schedules')
      .select('*');

    const schedulesMap: Record<string, any> = {};
    schedulesData?.forEach(s => {
      schedulesMap[s.id] = s.slots;
    });

    res.json({
      schedules: schedulesMap,
      slotConfig: settings?.slot_config || {},
      professionals: professionals || [],
      availableDates: settings?.available_dates || [],
      timeList: settings?.time_list || [],
      logoUrl: settings?.logo_url || '',
      clientName: settings?.client_name || 'Benesse Quick Massage'
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.post("/api/save", async (req, res) => {
  try {
    const { schedules, slotConfig, professionals, availableDates, timeList, logoUrl, clientName } = req.body;

    await supabase
      .from('app_settings')
      .upsert({
        id: 'default',
        logo_url: logoUrl,
        client_name: clientName,
        available_dates: availableDates,
        time_list: timeList,
        slot_config: slotConfig,
        updated_at: new Date().toISOString()
      });

    if (professionals && professionals.length > 0) {
      await supabase
        .from('professionals')
        .upsert(professionals.map((p: any) => ({
          id: p.id,
          name: p.name,
          slot_config: p.slotConfig || {}
        })));
    }

    if (schedules) {
      const scheduleEntries = Object.entries(schedules).map(([key, slots]) => {
        const [date, proId] = key.split('::');
        return {
          id: key,
          date,
          professional_id: proId,
          slots,
          updated_at: new Date().toISOString()
        };
      });

      if (scheduleEntries.length > 0) {
        await supabase
          .from('schedules')
          .upsert(scheduleEntries);
      }
    }

    res.json({ status: "success" });
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ error: "Failed to save data" });
  }
});

export default app;
