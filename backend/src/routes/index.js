import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'

import currenciesRoutes from '../modules/currencies/currencies.routes.js'
import allowedUsersRoutes from '../modules/allowed-users/allowed-users.routes.js'
import exchangeRatesRoutes from '../modules/exchange-rates/exchange-rates.routes.js'
import categoriesRoutes from '../modules/categories/categories.routes.js'
import accountsRoutes from '../modules/accounts/accounts.routes.js'
import openingBalancesRoutes from '../modules/opening-balances/opening-balances.routes.js'
import transactionsRoutes from '../modules/transactions/transactions.routes.js'
import exchangesRoutes from '../modules/exchanges/exchanges.routes.js'
import subscriptionsRoutes from '../modules/subscriptions/subscriptions.routes.js'
import subscriptionPaymentsRoutes from '../modules/subscriptions/subscription-payments.routes.js'
import installmentsRoutes from '../modules/installments/installments.routes.js'
import installmentPaymentsRoutes from '../modules/installments/installment-payments.routes.js'
import installmentAdvancePaymentsRoutes from '../modules/installments/installment-advance-payments.routes.js'
import budgetRoutes from '../modules/budget/budget.routes.js'
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js'
import reportsRoutes from '../modules/reports/reports.routes.js'

const router = Router()

// Todo /api requiere token (auth se monta aparte en app.js).
router.use(requireAuth)

router.use('/currencies', currenciesRoutes)
router.use('/allowed-users', allowedUsersRoutes)
router.use('/exchange-rates', exchangeRatesRoutes)
router.use('/categories', categoriesRoutes)
router.use('/accounts', accountsRoutes)
router.use('/opening-balances', openingBalancesRoutes)
router.use('/transactions', transactionsRoutes)
router.use('/exchanges', exchangesRoutes)
router.use('/subscriptions', subscriptionsRoutes)
router.use('/subscription-payments', subscriptionPaymentsRoutes)
router.use('/installments', installmentsRoutes)
router.use('/installment-payments', installmentPaymentsRoutes)
router.use('/installment-advance-payments', installmentAdvancePaymentsRoutes)
router.use('/budget', budgetRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/reports', reportsRoutes)

export default router
