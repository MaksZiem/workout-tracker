export type Membership = {
  name: string,
  price: number,
  description: string;
}

export const memberships: Membership[] = [
  {
    name: "Karnet OPEN",
    price: 149,
    description: "Nielimitowany dostęp do siłowni od 6:00 do 23:00, 7 dni w tygodniu."
  },
  {
    name: "Karnet STUDENT",
    price: 119,
    description: "Zniżkowy karnet miesięczny dla studentów z ważną legitymacją."
  },
  {
    name: "Wejście jednorazowe",
    price: 25,
    description: "Jednorazowe wejście do siłowni w dowolnym dniu i godzinie."
  },
  {
    name: "Karnet PORANNY",
    price: 99,
    description: "Dostęp od poniedziałku do piątku w godzinach 6:00–12:00."
  },
  {
    name: "Karnet WEEKENDOWY",
    price: 79,
    description: "Dostęp wyłącznie w soboty i niedziele."
  },
  {
    name: "Karnet 10 wejść",
    price: 200,
    description: "Elastyczny pakiet 10 wejść ważny przez 2 miesiące."
  },
  {
    name: "Karnet PREMIUM",
    price: 249,
    description: "Zawiera dostęp do siłowni, sauny, analizę składu ciała i 1 trening personalny miesięcznie."
  },
  {
    name: "Karnet DLA DWOJGA",
    price: 259,
    description: "Karnet miesięczny dla dwóch osób trenujących razem."
  },
  {
    name: "Karnet SENIOR 60+",
    price: 79,
    description: "Specjalna oferta dla osób 60+, dostosowane wsparcie trenerskie."
  },
  {
    name: "Pakiet STARTOWY",
    price: 199,
    description: "Idealny na początek: trening personalny, analiza składu ciała, plan treningowy i tydzień dostępu."
  }
];
