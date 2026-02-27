import { supabase } from '../lib/supabase'

export interface Company {
  id: string
  owner_user_id: string
  name: string | null
  phone: string | null
  preferred_currency: string
  created_at: string
  updated_at: string
}

export interface BusinessSettings {
  company_id: string
  investment_base_amount: number | null
  no_initial_investment: boolean
  created_at: string
  updated_at: string
}

export interface UpdateBusinessSettingsPayload {
  investment_base_amount: number | null
  no_initial_investment: boolean
}

const normalizeNumeric = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number(value)
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

const getAuthenticatedUserId = async (): Promise<string> => {
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  const userId = data.user?.id
  if (!userId) {
    throw new Error('Sessao invalida. Faca login novamente.')
  }

  return userId
}

export const businessService = {
  getCompany: async (): Promise<Company> => {
    const userId = await getAuthenticatedUserId()

    const { data, error } = await supabase
      .from('companies')
      .select('id, owner_user_id, name, phone, preferred_currency, created_at, updated_at')
      .eq('owner_user_id', userId)
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error('Empresa nao encontrada para este usuario.')
    }

    return data as Company
  },

  getBusinessSettings: async (): Promise<BusinessSettings> => {
    const company = await businessService.getCompany()

    const { data, error } = await supabase
      .from('business_settings')
      .select('company_id, investment_base_amount, no_initial_investment, created_at, updated_at')
      .eq('company_id', company.id)
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error('Configuracoes empresariais nao encontradas para esta empresa.')
    }

    return {
      ...(data as BusinessSettings),
      investment_base_amount: normalizeNumeric(data.investment_base_amount)
    }
  },

  updateBusinessSettings: async (payload: UpdateBusinessSettingsPayload): Promise<BusinessSettings> => {
    const company = await businessService.getCompany()

    const { data, error } = await supabase
      .from('business_settings')
      .update({
        investment_base_amount: payload.investment_base_amount,
        no_initial_investment: payload.no_initial_investment
      })
      .eq('company_id', company.id)
      .select('company_id, investment_base_amount, no_initial_investment, created_at, updated_at')
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error('Nao foi possivel atualizar as configuracoes empresariais.')
    }

    return {
      ...(data as BusinessSettings),
      investment_base_amount: normalizeNumeric(data.investment_base_amount)
    }
  }
}
