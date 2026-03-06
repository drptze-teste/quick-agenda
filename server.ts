import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/data", async (req, res) => {
    try {
      // Fetch settings
      const { data: settings } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'default')
        .single();

      // Fetch professionals
      const { data: professionalsData } = await supabase
        .from('professionals')
        .select('*');

      const professionals = professionalsData?.map(p => ({
        id: p.id,
        name: p.name,
        slotConfig: p.slot_config || {}
      })) || [];

      // Fetch schedules
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
        clientName: settings?.client_name || 'Cescon Barrieu',
        adminPassword: settings?.admin_password || 'admin123'
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({ error: "Failed to fetch data" });
    }
  });

  app.post("/api/login", async (req, res) => {
    const { password } = req.body;
    const { data: settings } = await supabase
      .from('app_settings')
      .select('admin_password')
      .eq('id', 'default')
      .single();

    const dbPassword = settings?.admin_password || 'admin123';

    if (dbPassword === password) {
      res.json({ status: "success", authenticated: true });
    } else {
      res.status(401).json({ status: "error", message: "Invalid password" });
    }
  });

  app.post("/api/save", async (req, res) => {
    try {
      const { schedules, slotConfig, professionals, availableDates, timeList, logoUrl, clientName, adminPassword } = req.body;

      // 1. Update Settings
      await supabase
        .from('app_settings')
        .upsert({
          id: 'default',
          logo_url: logoUrl,
          client_name: clientName,
          admin_password: adminPassword,
          available_dates: availableDates,
          time_list: timeList,
          slot_config: slotConfig,
          updated_at: new Date().toISOString()
        });

      // 2. Update Professionals
      if (professionals && professionals.length > 0) {
        await supabase
          .from('professionals')
          .upsert(professionals.map((p: any) => ({
            id: p.id,
            name: p.name,
            slot_config: p.slotConfig || {}
          })));
      }

      // 3. Update Schedules
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
