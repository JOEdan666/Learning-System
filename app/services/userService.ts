import prisma from '@/app/lib/prisma'

export class UserService {
  // 获取或创建用户档案
  static async getOrCreateProfile(userId: string, email: string) {
    let profile = await prisma.userProfile.findUnique({
      where: { id: userId }
    })

    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          id: userId,
          email: email
        }
      })
    }
    
    return profile
  }

  // 更新用户偏好
  static async updatePreferences(userId: string, data: {
    grade?: string
    region?: string
    goals?: string[]
    preferences?: any
  }) {
    return prisma.userProfile.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })
  }
}
