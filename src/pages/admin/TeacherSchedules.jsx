import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function TeacherSchedules() {
  const navigate = useNavigate()
  const { profile } = useAuth()

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 text-sm"
            style={{ backgroundColor: '#1f86c7' }}
          >
            ← Go Back
          </button>
        </div>

        <h2 className="text-2xl font-bold text-gray-900">Teacher Schedule Management</h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500">
        <div className="text-4xl mb-4">📅</div>
        <div className="text-lg font-medium text-gray-700 mb-2">Teacher schedule management coming soon</div>
        <div className="text-sm text-gray-500">This page will be used to create and manage teacher schedules.</div>
      </div>
    </Layout>
  )
}