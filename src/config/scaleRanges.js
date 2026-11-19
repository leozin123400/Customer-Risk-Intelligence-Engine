/**
 * Escala por plano e porte. PROVISÓRIO: parâmetros marcados abaixo são suposições
 * documentadas (as fases dão só as faixas por plano).
 */

// Fase 3A §5: usuários esperados por plano (referência, não limite rígido).
const USERS_RANGE_BY_PLAN = {
  STARTER: [1, 10],
  GROWTH: [5, 30],
  BUSINESS: [10, 100],
  ENTERPRISE: [50, 500],
};

// Fase 3B v1.0, D5: eventos de uso por dia, por cliente, calibrados para a capacidade.
const EVENTS_RANGE_BY_PLAN = {
  STARTER: [2, 8],
  GROWTH: [6, 20],
  BUSINESS: [15, 60],
  ENTERPRISE: [60, 200],
};

// Fase 3A §3: o porte "ajusta a quantidade de usuários e processos" dentro do plano.
// PROVISÓRIO. Média ponderada POR CLIENTE (pesos de porte 20/35/25/15/5) = 0,99, mas
// ponderada POR VOLUME ela é maior: os planos de maior volume concentram portes grandes.
// Efeito medido: ~+13% de eventos (~4,2 M em vez de ~3,7 M com 1.000 clientes). Aprovado.
const SIZE_SCALE = { MICRO: 0.6, SMALL: 0.85, MEDIUM: 1.05, LARGE: 1.4, ENTERPRISE: 2.0 };

// PROVISÓRIO: fração das licenças efetivamente usadas (expected_users / licensed_seats).
const SEAT_UTILIZATION = [0.55, 0.95];

module.exports = { USERS_RANGE_BY_PLAN, EVENTS_RANGE_BY_PLAN, SIZE_SCALE, SEAT_UTILIZATION };
