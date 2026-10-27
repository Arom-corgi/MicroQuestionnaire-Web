import type { Survey, SurveyGateway, Receipt } from '../models/questionnaire'

export const demoSurvey: Survey = {
  id: '00000000-0000-4000-8000-000000000001', title: '一起，让校园生活更好一点',
  description: '一份关于校园日常的小调查。聊聊你喜欢的活动、期待的变化，让下一次校园体验更贴近你的想法。',
  tags: ['校园生活', '体验问卷'], allow_anonymous: true, require_login: false,
  duplicate_policy: 'once', can_fill: true,
  current_version: { id: '00000000-0000-4000-8000-000000000002', questions: [
    { id: '10000000-0000-4000-8000-000000000001', type: 'single_choice', title: '你目前的身份是？', required: true, position: 0,
      validation: {}, options: [
        { id: '20000000-0000-4000-8000-000000000001', label: '在校学生', value: 'student', position: 0 },
        { id: '20000000-0000-4000-8000-000000000002', label: '教师 / 教职员工', value: 'teacher', position: 1 },
        { id: '20000000-0000-4000-8000-000000000003', label: '校友 / 其他', value: 'other', position: 2 },
      ] },
    { id: '10000000-0000-4000-8000-000000000002', type: 'dropdown', title: '你正在读哪个年级？', required: true, position: 1,
      validation: {}, depends_on: { logic: 'all', conditions: [{ question_id: '10000000-0000-4000-8000-000000000001', op: 'in', values: ['student'] }] },
      options: ['大一', '大二', '大三', '大四及以上'].map((label, i) => ({
        id: `30000000-0000-4000-8000-00000000000${i + 1}`, label, value: String(i + 1), position: i,
      })) },
    { id: '10000000-0000-4000-8000-000000000003', type: 'multiple_choice', title: '你想参加哪些校园活动？',
      description: '选择你最感兴趣的方向，最多选 3 项。', required: true, position: 2,
      validation: { min_selections: 1, max_selections: 3 }, options: ['运动与户外', '音乐与艺术', '读书与交流', '志愿与公益'].map((label, i) => ({
        id: `40000000-0000-4000-8000-00000000000${i + 1}`, label, value: String(i + 1), position: i,
      })) },
    { id: '10000000-0000-4000-8000-000000000004', type: 'rating', title: '你对目前校园生活的满意度是？',
      description: '1 分表示不太满意，5 分表示非常满意。', required: true, position: 3,
      validation: { min: 1, max: 5 }, options: [] },
    { id: '10000000-0000-4000-8000-000000000005', type: 'text', title: '还有什么想对我们说的？',
      description: '一个建议、一个小愿望，或者一段想分享的经历。', required: false, position: 4,
      validation: { max_length: 500 }, options: [] },
  ] },
}

// An explicit /demo route only. Real requests never fall back to this fixture.
export class DemoSurveyService implements SurveyGateway {
  async load(): Promise<Survey> { return structuredClone(demoSurvey) }
  async submit(): Promise<Receipt> {
    return { submission_id: demoSurvey.id, receipt_code: 'DEMO-PREVIEW', submitted_at: new Date().toISOString() }
  }
}
