"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Shield, Bell, Database, RefreshCw, Save, Loader2, Check } from "lucide-react";
import { useToast } from "./Toast";

export default function SettingsSection() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [whatsappConfig, setWhatsappConfig] = useState({
    messageTemplate: "NENEZ\n\nHola {nombre}, tu entrada está lista.\nSerial: {serial}\n\nPresenta el PDF adjunto en puerta.",
    autoSendOnApprove: true,
    notifyOnReject: true,
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    toast("success", "Configuración guardada", "Los cambios se aplicarán inmediatamente.");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Configuración</p>
        <p className="text-xl font-black text-white mt-1">Ajustes del Panel</p>
      </div>

      {/* WhatsApp Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-950/50 border border-green-500/20">
            <Bell className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-black text-white">WhatsApp</p>
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Notificaciones a clientes</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Plantilla de mensaje</p>
            <textarea value={whatsappConfig.messageTemplate} onChange={(e) => setWhatsappConfig({ ...whatsappConfig, messageTemplate: e.target.value })} rows={4}
              className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-xs font-bold text-white placeholder-zinc-800 outline-none transition focus:border-green-500/50 resize-none"
            />
            <p className="text-[7px] text-zinc-600">Variables: {'{nombre}'}, {'{serial}'}, {'{evento}'}, {'{fecha}'}</p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setWhatsappConfig({ ...whatsappConfig, autoSendOnApprove: !whatsappConfig.autoSendOnApprove })}
                className={`h-5 w-10 rounded-full transition-colors ${whatsappConfig.autoSendOnApprove ? "bg-green-600" : "bg-zinc-700"}`}
              >
                <div className={`h-5 w-5 rounded-full bg-white transition-transform ${whatsappConfig.autoSendOnApprove ? "translate-x-5" : ""}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white">Envío automático al aprobar</p>
                <p className="text-[7px] text-zinc-500">Enviar entrada por WhatsApp automáticamente al aprobar un comprobante.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setWhatsappConfig({ ...whatsappConfig, notifyOnReject: !whatsappConfig.notifyOnReject })}
                className={`h-5 w-10 rounded-full transition-colors ${whatsappConfig.notifyOnReject ? "bg-green-600" : "bg-zinc-700"}`}
              >
                <div className={`h-5 w-5 rounded-full bg-white transition-transform ${whatsappConfig.notifyOnReject ? "translate-x-5" : ""}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white">Notificar rechazos</p>
                <p className="text-[7px] text-zinc-500">Enviar mensaje al cliente cuando su comprobante sea rechazado.</p>
              </div>
            </label>
          </div>
        </div>
      </motion.div>

      {/* Data */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-950/50 border border-blue-500/20">
            <Database className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-black text-white">Base de Datos</p>
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Almacenamiento local (JSON)</p>
          </div>
        </div>
        <p className="text-[10px] text-zinc-400 leading-relaxed">
          Los datos se almacenan en archivos JSON locales. Para producción, se recomienda migrar a Supabase.
        </p>
      </motion.div>

      {/* Security */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-950/50 border border-red-500/20">
            <Shield className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-black text-white">Seguridad</p>
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Acceso al panel</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/40 p-3">
            <p className="text-[10px] text-zinc-400">Usuario admin</p>
            <p className="text-[10px] font-bold text-zinc-200">admin</p>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/40 p-3">
            <p className="text-[10px] text-zinc-400">Credenciales</p>
            <p className="text-[10px] font-bold text-zinc-200">••••••••</p>
          </div>
        </div>
        <p className="text-[8px] text-zinc-600 mt-3">Cambia las credenciales en app/admin/page.tsx</p>
      </motion.div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-white shadow-[0_0_25px_rgba(255,0,24,0.2)] transition hover:bg-red-500 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Guardando..." : "Guardar Configuración"}
        </button>
      </div>
    </div>
  );
}
