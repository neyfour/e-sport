import User, { type IUser } from "../models/User"

export const getUserById = async (id: string): Promise<IUser | null> => {
  try {
    return await User.findById(id)
  } catch (error) {
    console.error(`Error fetching user with id ${id}:`, error)
    throw error
  }
}

export const getUserByEmail = async (email: string): Promise<IUser | null> => {
  try {
    return await User.findOne({ email })
  } catch (error) {
    console.error(`Error fetching user with email ${email}:`, error)
    throw error
  }
}

export const createUser = async (userData: Partial<IUser>): Promise<IUser> => {
  try {
    const user = new User(userData)
    return await user.save()
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export const updateUser = async (id: string, userData: Partial<IUser>): Promise<IUser | null> => {
  try {
    return await User.findByIdAndUpdate(id, userData, { new: true })
  } catch (error) {
    console.error(`Error updating user with id ${id}:`, error)
    throw error
  }
}

export const deleteUser = async (id: string): Promise<boolean> => {
  try {
    const result = await User.findByIdAndDelete(id)
    return !!result
  } catch (error) {
    console.error(`Error deleting user with id ${id}:`, error)
    throw error
  }
}

