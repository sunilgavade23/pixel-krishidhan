import React, { useState } from 'react';
import MobileLayout from '../components/MobileLayout';
import { submitSupportTicket } from '../services';
import { Mail, Phone, ChevronDown, ChevronUp, Send, CheckCircle2, AlertCircle } from 'lucide-react';

const HelpSupport = ({ t }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        category: '',
        message: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // 'success' or 'error'
    const [errorMessage, setErrorMessage] = useState('');
    const [openFaq, setOpenFaq] = useState(null);

    const faqs = [
        {
            question: "How can I rent agricultural equipment?",
            answer: "Browse the available equipment, select the machine you need, view its details and availability, and send a rental request to the equipment owner."
        },
        {
            question: "How can I list my agricultural machinery?",
            answer: "Log in to your account, navigate to Post Equipment, enter the machinery details, upload its images, provide rental pricing and location, and submit the listing."
        },
        {
            question: "How can I send a rental request?",
            answer: "Open the equipment details page, check the availability and rental information, and click the rental request button to send your request to the owner."
        },
        {
            question: "How can I manage my bookings?",
            answer: "Visit the My Orders section to view and track your rental requests and their current status."
        },
        {
            question: "How can I manage my equipment listings?",
            answer: "Visit the My Listings section to view and manage the agricultural equipment you have posted."
        }
    ];

    const toggleFaq = (index) => {
        if (openFaq === index) {
            setOpenFaq(null);
        } else {
            setOpenFaq(index);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Full Name is required';
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = 'Email Address is required';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Invalid Email Address';
        }

        if (!formData.category) newErrors.category = 'Issue Category is required';
        if (!formData.message.trim()) newErrors.message = 'Message is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            alert("Please fill in all required fields correctly.");
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus(null);
        setErrorMessage('');

        const userId = localStorage.getItem('kd_uid') || null;

        const ticketData = {
            ...formData,
            userId,
        };

        try {
            const result = await submitSupportTicket(ticketData);

            if (result.ok) {
                setSubmitStatus('success');
                setFormData({ name: '', email: '', category: '', message: '' });
                alert("Success! Your support ticket has been submitted.");
            } else {
                setSubmitStatus('error');
                setErrorMessage(result.message || 'Unknown error occurred.');
                alert("Error: " + (result.message || 'Unknown error occurred.'));
            }
        } catch (err) {
            setSubmitStatus('error');
            setErrorMessage(err.message || 'Unknown error');
            alert("Exception: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    return (
        <MobileLayout t={t}>
            <div className="pb-6 px-4">
                
                {/* Header */}
                <div className="mb-6 mt-2 text-center">
                    <h2 className="text-2xl font-black text-gray-800">Help &amp; Support</h2>
                    <p className="text-gray-500 text-sm mt-1">We are here to help you</p>
                </div>

                {/* Contact Information */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Contact Information</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-50 p-2.5 rounded-full text-green-600">
                                <Mail size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Email Support</p>
                                <a href="mailto:sunilgavade1111@gmail.com" className="text-sm font-bold text-gray-800">sunilgavade1111@gmail.com</a>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-green-50 p-2.5 rounded-full text-green-600">
                                <Phone size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Phone Support</p>
                                <a href="tel:9075727271" className="text-sm font-bold text-gray-800">9075727271</a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Support Form */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Send us a Message</h3>
                    
                    {submitStatus === 'success' && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2 text-sm font-medium">
                            <CheckCircle2 size={18} />
                            Your message has been sent successfully.
                        </div>
                    )}

                    {submitStatus === 'error' && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex flex-col gap-1 text-sm font-medium">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={18} />
                                Failed to send message. Please try again.
                            </div>
                            {errorMessage && (
                                <span className="text-xs text-red-500 ml-6 break-words">{errorMessage}</span>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                            <input 
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                className={`w-full p-3 rounded-xl border ${errors.name ? 'border-red-500' : 'border-gray-200'} outline-none focus:border-green-500 text-sm`}
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                            <input 
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                className={`w-full p-3 rounded-xl border ${errors.email ? 'border-red-500' : 'border-gray-200'} outline-none focus:border-green-500 text-sm`}
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Issue Category</label>
                            <select 
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className={`w-full p-3 rounded-xl border ${errors.category ? 'border-red-500' : 'border-gray-200'} outline-none focus:border-green-500 text-sm bg-white`}
                            >
                                <option value="" disabled>Select a category</option>
                                <option value="Account &amp; Login">Account &amp; Login</option>
                                <option value="Equipment Listing">Equipment Listing</option>
                                <option value="Booking &amp; Rental Requests">Booking &amp; Rental Requests</option>
                                <option value="Payments">Payments</option>
                                <option value="Technical Issues">Technical Issues</option>
                                <option value="Other">Other</option>
                            </select>
                            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Message</label>
                            <textarea 
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Describe your issue or query"
                                rows="4"
                                className={`w-full p-3 rounded-xl border ${errors.message ? 'border-red-500' : 'border-gray-200'} outline-none focus:border-green-500 text-sm resize-none`}
                            ></textarea>
                            {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full bg-green-700 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isSubmitting ? (
                                'Sending...'
                            ) : (
                                <>
                                    <Send size={18} /> Submit
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* FAQs */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Frequently Asked Questions</h3>
                    <div className="space-y-3">
                        {faqs.map((faq, index) => (
                            <div key={index} className="border border-gray-100 rounded-xl overflow-hidden">
                                <button 
                                    className="w-full text-left p-4 bg-gray-50 flex items-center justify-between font-bold text-sm text-gray-800 hover:bg-gray-100 transition-colors"
                                    onClick={() => toggleFaq(index)}
                                >
                                    <span className="pr-4">{faq.question}</span>
                                    {openFaq === index ? <ChevronUp size={18} className="text-green-600 flex-shrink-0" /> : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />}
                                </button>
                                {openFaq === index && (
                                    <div className="p-4 text-sm text-gray-600 bg-white border-t border-gray-100">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </MobileLayout>
    );
};

export default HelpSupport;
