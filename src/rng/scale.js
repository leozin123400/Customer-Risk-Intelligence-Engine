const { createChildRng } = require("../rng/prng");
const { lognormalFromRange } = require("../rng/continuous");
const {
  USERS_RANGE_BY_PLAN, EVENTS_RANGE_BY_PLAN, SIZE_SCALE, SEAT_UTILIZATION,
} = require("../config/scaleRanges");

/** Limita v ao intervalo [0.5 x min x fator, 2 x max x fator]: a cauda existe, mas sem absurdos. */
function limitar(v, [min, max], fator) {
  return Math.min(Math.max(v, 0.5 * min * fator), 2 * max * fator);
}

/**
 * Escala de UM cliente (licenças, usuários esperados, eventos/dia esperados).
 * Usa um rng isolado por cliente (seed global + customer_id + "scale"), então
 * regenerar um cliente sozinho dá exatamente o mesmo resultado do lote inteiro.
 *
 *  licensed_seats        -> observed.subscriptions (Fase 3B §5.2)
 *  expected_users,
 *  baseline_daily_events -> truth.customer_scenarios (Fase 3B §5.8)
 */
function generateScale(globalSeed, { customer_id, company_size, plan }) {
  const rng = createChildRng(globalSeed, `${customer_id}:scale`);
  const fator = SIZE_SCALE[company_size];

  const usersRange = USERS_RANGE_BY_PLAN[plan];
  const seats = Math.max(
    1,
    Math.round(limitar(lognormalFromRange(rng, ...usersRange) * fator, usersRange, fator))
  );

  const [uMin, uMax] = SEAT_UTILIZATION;
  const utilizacao = uMin + rng.next() * (uMax - uMin);
  const expectedUsers = Math.max(1, Math.round(seats * utilizacao));

  const eventsRange = EVENTS_RANGE_BY_PLAN[plan];
  const eventos = Math.max(
    0.5,
    limitar(lognormalFromRange(rng, ...eventsRange) * fator, eventsRange, fator)
  );

  return {
    customer_id,
    licensed_seats: seats,
    expected_users: expectedUsers,
    baseline_daily_events: Math.round(eventos * 100) / 100,
  };
}

module.exports = { generateScale };
