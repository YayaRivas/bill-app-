/**
 * @jest-environment jsdom
 */

 import { screen, waitFor } from "@testing-library/dom"
 import "@testing-library/jest-dom"
 import userEvent from '@testing-library/user-event'
 import { localStorageMock } from "../__mocks__/localStorage.js"
 import router from "../app/Router.js"
 import { ROUTES_PATH } from "../constants/routes.js"
 import { default as mockStore } from "../__mocks__/store.js"
 import { ROUTES } from '../constants/routes.js'
 import NewBillUI from "../views/NewBillUI.js"
 import NewBill from "../containers/NewBill.js"
 
 
 describe("Given I am connected as an employee", () => {
   describe("When I am on NewBill Page", () => {
     test("Then mail icon in vertical layout should be highlighted and should render NewBillPage", () => {
       Object.defineProperty(window, 'localStorage', { value: localStorageMock })
       window.localStorage.setItem('user', JSON.stringify({
         type: 'Employee',
         email: "a@a"
       }))
 
       const root = document.createElement("div");
       root.setAttribute("id", "root");
       document.body.append(root);
       router();
       window.onNavigate(ROUTES_PATH.NewBill);
 
       const mailIcon = screen.getByTestId('icon-mail');
 
       expect(mailIcon).toHaveClass('active-icon');
       expect(screen.queryByText("Envoyer une note de frais")).toBeTruthy();
     })
   })
 
   describe("When I am on NewBill Page and I upload an allowed file", () => {
     test("Then it must not launch alert", () => {
 
       Object.defineProperty(window, 'alert', { value: jest.fn() })
 
       const html = NewBillUI();
       document.body.innerHTML = html;
 
       const newBill = new NewBill({ document, onNavigate: null, store: mockStore, localStorage: window.localStorage });
 
       const handleChangeFileSpy = jest.spyOn(newBill, 'handleChangeFile');
 
       const inputChooseFile = screen.getByTestId('file');
       inputChooseFile.addEventListener('change', (event) => newBill.handleChangeFile(event));
 
       const fileOk = new File(["image"], "bonFormat.jpeg", { type: "image/jpeg" });
 
       userEvent.upload(inputChooseFile, fileOk);
       expect(handleChangeFileSpy).toHaveBeenCalled();
       expect(alert).not.toHaveBeenCalled();
     })
   })
 
   describe("When I am on NewBill Page and I upload a not allowed file", () => {
     test("Then it must launch alert", () => {
 
       Object.defineProperty(window, 'alert', { value: jest.fn() })
 
       document.body.innerHTML = NewBillUI();
 
       const newBill = new NewBill({ document, onNavigate: null, store: mockStore, localStorage: window.localStorage });
 
       const handleChangeFileSpy = jest.spyOn(newBill, 'handleChangeFile');
 
       const inputChooseFile = screen.getByTestId('file');
       inputChooseFile.addEventListener('change', (event) => newBill.handleChangeFile(event));
 
       const fileNok = new File(["texte"], "mauvaisFormat.txt", { type: "text/plain" });
       userEvent.upload(inputChooseFile, fileNok);
 
       expect(handleChangeFileSpy).toHaveBeenCalled();
       expect(alert).toHaveBeenCalled();
     })
   })
 
   describe("When I am on NewBill Page and I upload a file, API POST bill", () => {
     test("Then mockedStore should return bill test data ", async () => {
       document.body.innerHTML = NewBillUI();
 
       const newBill = new NewBill({ document, onNavigate: null, store: mockStore, localStorage: window.localStorage });
 
       const inputChooseFile = screen.getByTestId('file');
       inputChooseFile.addEventListener('change', (event) => newBill.handleChangeFile(event));
 
       const fileOk = new File(["image"], "bonFormat.jpeg", { type: "image/jpeg" });
       userEvent.upload(inputChooseFile, fileOk);
 
       await waitFor(() => newBill.fileUrl !== null);
       expect(newBill.billId).toBe('1234');
       expect(newBill.fileUrl).toBe('https://localhost:3456/images/test.jpg');
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
 
     test("mock API should return 404 message error", async () => {
 
       console.error = jest.fn()
 
       mockStore.bills.mockImplementationOnce(() => {
         return {
           create: () => {
             return Promise.reject(new Error('Erreur 404'))
           }
         }
       })
 
       document.body.innerHTML = NewBillUI();
       const newBill = new NewBill({ document, onNavigate: null, store: mockStore, localStorage: window.localStorage });
 
       const inputChooseFile = screen.getByTestId('file');
       inputChooseFile.addEventListener('change', (event) => newBill.handleChangeFile(event));
 
       const fileOk = new File(["image"], "bonFormat.jpeg", { type: "image/jpeg" });
       userEvent.upload(inputChooseFile, fileOk);
 
       await waitFor(() => console.error('Erreur 404'));
 
       expect(console.error).toHaveBeenCalledWith('Erreur 404')
     })
   })
 
   describe("When I am on NewBill Page and I click on submit button", () => {
     test("Should navigate to Bills page", async () => {
 
       const onNavigate = (pathname) => {
         document.body.innerHTML = ROUTES({ pathname })
       }
 
       document.body.innerHTML = NewBillUI();
       const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });
 
       const updateBillSpy = jest.spyOn(newBill, 'updateBill');
 
       const submitButton = screen.getByTestId('submitButton');
       submitButton.addEventListener('submit', (event) => newBill.handleSubmit(event));
       userEvent.click(submitButton);
       expect(updateBillSpy).toHaveBeenCalled();
 
       await waitFor(() => screen.getByTestId('btn-new-bill'));
       expect(screen.getByTestId('btn-new-bill')).toBeTruthy();
     })
   })
 
 })