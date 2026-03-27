import { Link } from "react-router-dom";

export default function ModuleActionCard({ title, desc, link }) {
  return (
    <Link
      to={link}
      className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition"
    >
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 mt-1">{desc}</p>
    </Link>
  );
}