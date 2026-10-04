import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { translations } from "./utils/translations";

// Pages
import SplashScreen from "./pages/SplashScreen";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Categories from "./pages/Categories";
import PostChoice from "./pages/PostChoice";
import PostEquipment from "./pages/PostEquipment";
import EquipmentDetails from "./pages/EquipmentDetails";
import Profile from "./pages/Profile";
import MyOrders from "./pages/MyOrders";
import MyListings from "./pages/MyListings";
import PaymentDemo from "./pages/PaymentDemo";
import Schemes from "./pages/Schemes";
import ImpactDashboard from "./pages/ImpactDashboard";
import CleanupRequests from "./pages/CleanupRequests";
import HelpSupport from "./pages/HelpSupport";


import Chatbot from "./components/Chatbot";

const ProtectedRoute = ({ children }) => {
    const uid = localStorage.getItem("kd_uid");
    return uid ? children : <Navigate to="/login" replace />;
};

function App() {
    const [lang, setLang] = useState(
        () => localStorage.getItem("kd_lang") || "en"
    );

    const formatFallbackLabel = (key) =>
        String(key || "")
            .replace(/_/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/\b\w/g, (c) => c.toUpperCase());

    const t = (key) =>
        translations?.[lang]?.[key] ??
        translations?.en?.[key] ??
        formatFallbackLabel(key);

    useEffect(() => {
        localStorage.setItem("kd_lang", lang);
    }, [lang]);

    return (
        <Router>
            <div className="min-h-screen bg-gray-50 text-gray-900 font-sans relative overflow-x-hidden">
                <Routes>
                    {/* Splash */}
                    <Route path="/" element={<SplashScreen t={t} />} />

                    {/* Auth */}
                    <Route path="/login" element={<Login t={t} />} />
                    <Route path="/register" element={<Register t={t} />} />

                    {/* Home */}
                    <Route
                        path="/home"
                        element={
                            <ProtectedRoute>
                                <Home t={t} />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/categories"
                        element={
                            <ProtectedRoute>
                                <Categories t={t} />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/post-choice"
                        element={
                            <ProtectedRoute>
                                <PostChoice t={t} />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/post-equipment"
                        element={
                            <ProtectedRoute>
                                <PostEquipment t={t} />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/equipment/:id"
                        element={
                            <ProtectedRoute>
                                <EquipmentDetails t={t} />
                            </ProtectedRoute>
                        }
                    />


                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <Profile
                                    t={t}
                                    setLang={setLang}
                                    currentLang={lang}
                                />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/my-orders"
                        element={
                            <ProtectedRoute>
                                <MyOrders t={t} />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/my-listings"
                        element={
                            <ProtectedRoute>
                                <MyListings t={t} />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/payment"
                        element={
                            <ProtectedRoute>
                                <PaymentDemo t={t} />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/impact"
                        element={
                            <ProtectedRoute>
                                <ImpactDashboard t={t} />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/schemes"
                        element={
                            <ProtectedRoute>
                                <Schemes t={t} />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/cleanup"
                        element={
                            <ProtectedRoute>
                                <CleanupRequests t={t} />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/help"
                        element={
                            <ProtectedRoute>
                                <HelpSupport t={t} />
                            </ProtectedRoute>
                        }
                    />
                </Routes>

                <Chatbot t={t} />
            </div>
        </Router>
    );
}

export default App;