"use client"

import type React from "react"
import { useState } from "react"
import { Mail, Phone, MapPin, Send, Clock } from "lucide-react"
import toast from "react-hot-toast"
import emailjs from "@emailjs/browser"

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    emailjs.send(
      'service_61ah45s', // Replace with actual service ID
        'template_ea9kxwv', // Replace with actual template ID
        {
          from_name: formData.name,
          from_email: formData.email,
          subject: formData.subject,
          message: formData.message,
        },
        'Q5xQ8hU7Av4oHnsKw' // Replace with actual public key
    )
    .then(() => {
      toast.success("Votre message a été envoyé avec succès !")
      setFormData({ name: "", email: "", subject: "", message: "" })
    })
    .catch(() => {
      toast.error("Échec de l'envoi du message. Veuillez réessayer.")
    })
    .finally(() => setIsSubmitting(false))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Contactez-nous</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Vous avez des questions ? Nous sommes là pour vous aider !
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Envoyez-nous un message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nom complet" required className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              <input type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="Sujet" required className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Message" required rows={6} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70">
                {isSubmitting ? "Envoi en cours..." : <><Send className="w-5 h-5" /> Envoyer</>}
              </button>
            </form>
          </div>

          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Nos coordonnées</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Adresse</h3>
                    <p className="text-gray-600 dark:text-gray-400">Avenue Mohamed V, Rabat, Maroc</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Téléphone</h3>
                    <p className="text-gray-600 dark:text-gray-400">+212 5 37 77 77 77</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Email</h3>
                    <p className="text-gray-600 dark:text-gray-400">e.sportscompany.contact@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 h-96">
          <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3318.217209092335!2d-6.832551284689027!3d34.02088238061417!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xda76cafd8123b5b%3A0x5d7c10d56f758c!2sAvenue%20Mohamed%20V%2C%20Rabat%2C%20Maroc!5e0!3m2!1sfr!2s!4v1620176017896!5m2!1sfr!2s" width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" title="Carte de Rabat" className="rounded-lg"></iframe>
        </div>
      </div>
    </div>
  )
}
