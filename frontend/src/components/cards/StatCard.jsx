import { motion } from "framer-motion";

export default function StatCard({ title, value, icon, color }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4"
    >
      <div className={`p-3 rounded-lg ${color} text-white`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <h3 className="text-xl font-bold text-slate-900">{value}</h3>
      </div>
    </motion.div>
  );
}