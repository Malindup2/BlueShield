
const apiBaseUrl =
	import.meta.env.VITE_API_BASE_URL ||
	(import.meta.env.PROD ? "https://blueshield-kixw.onrender.com" : "http://localhost:5000");

export default apiBaseUrl;