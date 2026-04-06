function berechneStromspeicher({ speicher, pvLeistung, stromverbrauch, strompreis, speicherkosten }) {
  const pvErtrag = pvLeistung * 1000 * 0.9;
  const eigenverbrauchOhne = Math.min(stromverbrauch * 0.3, pvErtrag * 0.3);
  const eigenverbrauchMit = Math.min(stromverbrauch * (0.3 + speicher * 0.03), pvErtrag * (0.3 + speicher * 0.05));
  const ohneSpeicher = eigenverbrauchOhne * (strompreis / 100);
  const mitSpeicher = eigenverbrauchMit * (strompreis / 100);
  const ersparnis = mitSpeicher - ohneSpeicher;
  const investition = speicher * speicherkosten;
  const amortisation = ersparnis > 0 ? Math.round((investition / ersparnis) * 10) / 10 : 0;
  
  return {
    ohneSpeicher: Math.round(ohneSpeicher * 100) / 100,
    mitSpeicher: Math.round(mitSpeicher * 100) / 100,
    ersparnis: Math.round(ersparnis * 100) / 100,
    investition: Math.round(investition * 100) / 100,
    amortisation,
    eigenverbrauch: Math.round((eigenverbrauchMit / stromverbrauch) * 100),
  };
}

export { berechneStromspeicher };
