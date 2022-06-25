/**
 * @jest-environment jsdom
 */

 import { screen, waitFor } from "@testing-library/dom"
 import userEvent from '@testing-library/user-event'
 import '@testing-library/jest-dom'
 import { ROUTES } from '../constants/routes.js'
 import mockStore from "../__mocks__/store"
 import BillsUI from "../views/BillsUI.js"
 import { bills } from "../fixtures/bills.js"
 import { ROUTES_PATH } from "../constants/routes.js"
 import { localStorageMock } from "../__mocks__/localStorage.js"
 import Bills from "../containers/Bills.js"
 import router from "../app/Router.js"
 
 describe("Given I am connected as an employee", () => {
   describe("When I am on Bills page with loading parameter", () => {
     test("Then loading page should appear", () => {
       document.body.innerHTML = BillsUI({ data: bills, loading: true })
       const loading = screen.getByTestId("test-loading");
       expect(loading).toBeTruthy();
     })
 
     test("Then bill icon in vertical layout should be highlighted", async () => {
       Object.defineProperty(window, 'localStorage', { value: localStorageMock })
       window.localStorage.setItem('user', JSON.stringify({
         type: 'Employee'
       }))
       const root = document.createElement("div")
       root.setAttribute("id", "root")
       document.body.append(root)
       router()
       window.onNavigate(ROUTES_PATH.Bills)
       await waitFor(() => screen.getByTestId('icon-window'))
       const windowIcon = screen.getByTestId('icon-window')
       expect(windowIcon).toHaveClass('active-icon');
     })
 
     test("fetches bills from mock API GET", async () => {
       Object.defineProperty(window, 'localStorage', { value: localStorageMock })
       window.localStorage.setItem('user', JSON.stringify({
         type: 'Employee'
       }))
 
       const billsInst = new Bills({ document, onNavigate, store: mockStore, localStorage: window.localStorage });
 
       billsInst.getBills()
         .then(bills => {
           expect(bills).toHaveLength(4);
         })
     })
 
     // test déja présent
     test("Then bills should be ordered from earliest to latest", () => {
       document.body.innerHTML = BillsUI({ data: bills })
       const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
       const antiChrono = (a, b) => ((a < b) ? 1 : -1)
       const datesSorted = [...dates].sort(antiChrono)
       expect(dates).toEqual(datesSorted)
     })
 
     describe('When I click on eye icon', () => {
       test(('Then, it should launch modal'), () => {
         document.body.innerHTML = BillsUI({ data: bills })
 
         const onNavigate = null;
         const store = jest.fn();
         const localStorage = jest.fn();
         const billsCont = new Bills({ document, onNavigate, store, localStorage })
 
         // Méthode fictive bootstrap .modal('show')
         $.fn.modal = jest.fn();
 
         const handleClickIconE = jest.fn(billsCont.handleClickIconEye);
 
         const iconEye = screen.getAllByTestId('icon-eye');
         iconEye.forEach(el => {
           el.addEventListener("click", () => handleClickIconE(el));
           userEvent.click(el);
           expect(handleClickIconE).toHaveBeenCalled();
           expect(screen.queryByText("Justificatif")).toBeTruthy();
         })
       })
     })
 
     describe('When I click newBill button', () => {
       test(('Then, it should navigate to newBill page'), () => {
         const onNavigate = (pathname) => {
           document.body.innerHTML = ROUTES({ pathname })
         }
 
         Object.defineProperty(window, 'localStorage', { value: localStorageMock })
         window.localStorage.setItem('user', JSON.stringify({
           type: 'Employee'
         }))
 
         document.body.innerHTML = '';
         document.body.innerHTML = BillsUI({ data: bills })
         const billsContainer = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage })
 
         const handleClickNewBil = jest.fn(billsContainer.handleClickNewBill);
         const btnNewBill = screen.getByTestId('btn-new-bill');
         btnNewBill.addEventListener("click", handleClickNewBil);
         userEvent.click(btnNewBill);
 
         expect(handleClickNewBil).toHaveBeenCalled();
         expect(screen.queryByText("Envoyer une note de frais")).toBeTruthy();
       })
     })
 
     describe("When an error occurs on API", () => {
       beforeEach(() => {
         jest.spyOn(mockStore, "bills")
         Object.defineProperty(
           window,
           'localStorage',
           { value: localStorageMock }
         )
         window.localStorage.setItem('user', JSON.stringify({
           type: 'Employee',
           email: "a@a"
         }))
         const root = document.createElement("div")
         root.setAttribute("id", "root")
         document.body.appendChild(root)
         router()
       })
 
       test("fetches bills from an API and fails with 404 message error", async () => {
         mockStore.bills()
           .create(() => { throw new Error("Error 404") })
           .catch(error => {
             document.body.innerHTML = BillsUI({ data: [], error });
             const message = screen.getByText(/Error 404/)
             expect(message).toBeTruthy()
           })
       })
 
       test("fetches bills from an API and fails with 500 message error", async () => {
         mockStore.bills()
           .list(() => { throw new Error("Error 500") })
           .catch(error => {
             document.body.innerHTML = BillsUI({ data: [], error })
             const message = screen.getByText(/Error 500/)
             expect(message).toBeTruthy()
           })
       })
     })
 
   })
 })