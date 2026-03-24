// react frontend for submit a report page

import React, { useState } from "react";
import axios from "axios";

const SubmitAReport = () => {
    const [reportData, setReportData] = useState({
        title: "",
        description: "",
        reportType: "OTHER",
        severity: "MEDIUM",
        location: "",
    }); 

    const handleChange = (e) => {
        setReportData({
            ...reportData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("/api/reports", reportData);
            console.log("Report submitted successfully:", response.data);
        } catch (error) {
            console.error("Error submitting report:", error);
        }
    };

    return (
        <div>
            <h1>Submit a Report</h1>
            <form onSubmit={handleSubmit}>  
                <input type="text" name="title" placeholder="Title" value={reportData.title} onChange={handleChange} required />
                <textarea name="description" placeholder="Description" value={reportData.description} onChange={handleChange} required />
                <select name="reportType" value={reportData.reportType} onChange={handleChange}>
                    <option value="POLLUTION">Pollution</option>
                    <option value="ILLEGAL_FISHING">Illegal Fishing</option>
                    <option value="HAZARD">Hazard</option>
                    <option value="ENVIRONMENTAL">Environmental</option>
                    <option value="OTHER">Other</option>
                </select>
                <select name="severity" value={reportData.severity} onChange={handleChange}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                </select>
                <input type="text" name="location" placeholder="Location (address or coordinates)" value={reportData.location} onChange={handleChange} required />
                <button type="submit">Submit Report</button>
            </form>
        </div>
    );
}

export default SubmitAReport;

