import React, { useState } from 'react'
import './index.css'

const categories = [
  { id: 'body', name: '신체 활동' },
  { id: 'mind', name: '마음 성장' },
  { id: 'brain', name: '머리 사용' },
]

function App() {
  const [scores, setScores] = useState({ body: 0, mind: 0, brain: 0 })

  const handleChange = (category: string, value: number) => {
    setScores(prev => ({ ...prev, [category]: value }))
  }

  const total = Object.values(scores).reduce((a, b) => a + b, 0)
  const average = (total / 3).toFixed(1)

  return (
    <div style={{ fontFamily: 'Noto Sans KR, sans-serif', textAlign: 'center', marginTop: '50px' }}>
      <h1>자기성장 기록 앱 🌱</h1>
      <p>오늘의 신체·마음·머리 활동을 체크하세요</p>

      {categories.map(c => (
        <div key={c.id} style={{ margin: '20px 0' }}>
          <h3>{c.name}</h3>
          <input
            type="range"
            min="0"
            max="10"
            value={scores[c.id as keyof typeof scores]}
            onChange={e => handleChange(c.id, Number(e.target.value))}
          />
          <p>점수: {scores[c.id as keyof typeof scores]}</p>
        </div>
      ))}

      <h2>총점: {total} / 평균: {average}</h2>
      <p>💪 꾸준히 기록하면 성장의 변화를 볼 수 있습니다.</p>
    </div>
  )
}

export default App
