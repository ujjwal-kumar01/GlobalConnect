import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const roles = [
    {
        id: "student",
        title: "Student",
        description: "Currently enrolled in a program looking for opportunities",
    },
    {
        id: "alumni",
        title: "Alumni",
        description: "Graduated and looking to network or mentor others",
    },
    {
        id: "recruiter",
        title: "Recruiter",
        description: "Hiring top talent for global organizations",
    },
    {
        id: "admin",
        title: "Admin",
        description: "Platform management and organizational oversight",
    },
];

const OnboardingRole = () => {
    const [selectedRole, setSelectedRole] = useState("student");
    const navigate = useNavigate();

    const handleContinue = () => {
        if (!selectedRole) return;

        // Save temporarily (later use context/zustand)
        localStorage.setItem("selectedRole", selectedRole);

        if (selectedRole === "student" || selectedRole === "alumni") {
            navigate("/onboarding/student");
        } else if (selectedRole === "recruiter") {
            navigate("/onboarding/recruiter");
        } else {
            navigate("/onboarding/admin");
        }// next step
    };

    return (
        <div className="min-h-screen bg-slate-100 flex justify-center items-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 relative">

                {/* HEADER */}
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => navigate(-1)} className="text-xl">←</button>
                    <h1 className="text-lg font-semibold">Global Connect</h1>
                    <div></div>
                </div>

                {/* PROGRESS */}
                <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                        <span>Getting Started</span>
                        <span>1 of 2</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div className="w-1/2 h-2 bg-orange-500 rounded-full"></div>
                    </div>
                </div>

                {/* TITLE */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Choose your role
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Select the option that best describes your purpose on Global Connect to personalize your experience.
                    </p>
                </div>

                {/* ROLE OPTIONS */}
                <div className="space-y-4 mb-6">
                    {roles.map((role) => {
                        const isSelected = selectedRole === role.id;

                        return (
                            <div
                                key={role.id}
                                onClick={() => setSelectedRole(role.id)}
                                className={`cursor-pointer p-4 rounded-2xl border transition-all flex justify-between items-center ${isSelected
                                        ? "border-orange-500 bg-orange-50"
                                        : "border-gray-200 bg-white"
                                    }`}
                            >
                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        {role.title}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {role.description}
                                    </p>
                                </div>

                                {/* RADIO */}
                                <div
                                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected
                                            ? "border-orange-500"
                                            : "border-gray-300"
                                        }`}
                                >
                                    {isSelected && (
                                        <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* CONTINUE BUTTON */}
                <button
                    onClick={handleContinue}
                    className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition"
                >
                    Continue
                </button>

                {/* FOOTER */}
                <p className="text-center text-sm text-gray-400 mt-4">
                    You can change your role later in settings
                </p>
            </div>
        </div>
    );
};

export default OnboardingRole;