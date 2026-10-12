import { useEffect, useState } from "react";
import { readApiJson } from "../utils/api.js";

const sections = [
  { id: "appointments", label: "View Appointments" },
  { id: "category", label: "Add New Category" },
  { id: "service", label: "Add New Service" },
  { id: "portfolio", label: "Add Image to Portfolio" },
];

function formatDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatStatus(value) {
  return value.replaceAll("_", " ");
}

function Management() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bootstrapKey, setBootstrapKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [newAccountEmail, setNewAccountEmail] = useState("");
  const [newAccountPassword, setNewAccountPassword] = useState("");
  const [newAccountRole, setNewAccountRole] = useState("Employee");
  const [showNewAccountPassword, setShowNewAccountPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationAvailable, setRegistrationAvailable] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  const [credential, setCredential] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const [selectedSection, setSelectedSection] = useState("appointments");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function checkRegistration() {
      try {
        const response = await fetch("/api/management/auth/bootstrap-status");
        const data = await readApiJson(
          response,
          "Unable to check management account setup.",
        );
        if (isCurrent) setRegistrationAvailable(data.registrationAvailable);
      } catch (requestError) {
        if (isCurrent) setError(requestError.message);
      } finally {
        if (isCurrent) setCheckingRegistration(false);
      }
    }

    checkRegistration();
    return () => {
      isCurrent = false;
    };
  }, []);

  async function managementRequest(url, options = {}) {
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${credential}`);
    if (options.body) headers.set("Content-Type", "application/json");
    const response = await fetch(url, { ...options, headers });
    return readApiJson(response, "Unable to complete the management request.");
  }

  async function loadAppointments() {
    const data = await managementRequest("/api/management/appointments");
    setAppointments(data.appointments);
    setIsAuthenticated(true);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `/api/management/auth/${isRegistering ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            ...(isRegistering ? { bootstrapKey } : {}),
          }),
        },
      );
      const authData = await readApiJson(
        response,
        "Unable to sign in to management.",
      );
      setCredential(authData.token);
      setUserRole(authData.user.role);
      setRegistrationAvailable(false);
      setIsRegistering(false);
      setPassword("");
      setBootstrapKey("");

      // Use the returned token directly for the first protected request because
      // React state updates are asynchronous.
      const appointmentsResponse = await fetch(
        "/api/management/appointments",
        { headers: { Authorization: `Bearer ${authData.token}` } },
      );
      const appointmentData = await readApiJson(
        appointmentsResponse,
        "Unable to load management appointments.",
      );
      setAppointments(appointmentData.appointments);
      setIsAuthenticated(true);
    } catch (requestError) {
      setAppointments([]);
      setCredential("");
      setIsAuthenticated(false);
      setIsCreatingAccount(false);
      setNewAccountEmail("");
      setNewAccountPassword("");
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAccount(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const data = await managementRequest("/api/management/auth/accounts", {
        method: "POST",
        body: JSON.stringify({
          email: newAccountEmail,
          password: newAccountPassword,
          role: newAccountRole,
        }),
      });
      setNewAccountEmail("");
      setNewAccountPassword("");
      setNewAccountRole("Employee");
      setIsCreatingAccount(false);
      setNotice(`${data.user.role} account created for ${data.user.email}.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function chooseSection(section) {
    setSelectedSection(section);
    setError("");
    setNotice("");

    if (section === "appointments") {
      setLoading(true);
      try {
        await loadAppointments();
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    if (section === "service" || section === "category") {
      setLoading(true);
      try {
        const [categoryData, serviceData] = await Promise.all([
          managementRequest("/api/categories"),
          managementRequest("/api/management/services"),
        ]);
        setCategories(categoryData.categories);
        setServices(serviceData.services);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    if (section === "portfolio") {
      setLoading(true);
      try {
        const data = await managementRequest("/api/portfolio");
        setPortfolioImages(data.images);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleCreateCategory(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const formData = new FormData(form);
      const data = await managementRequest(
        editingCategory
          ? `/api/categories/${editingCategory.id}`
          : "/api/categories",
        {
        method: editingCategory ? "PATCH" : "POST",
        body: JSON.stringify({ name: formData.get("name") }),
      });
      setCategories((existing) =>
        editingCategory
          ? existing.map((category) =>
              category.id === data.category.id ? data.category : category,
            )
          : [...existing, data.category],
      );
      form.reset();
      setEditingCategory(null);
      setNotice(
        `Category “${data.category.name}” was ${editingCategory ? "updated" : "added"}.`,
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateService(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const formData = new FormData(form);
      const servicePayload = {
        categoryId: Number(formData.get("categoryId")),
        name: formData.get("name"),
        description: formData.get("description"),
        price: Number(formData.get("price")),
        depositAmount: Number(formData.get("depositAmount")),
        durationMinutes: Number(formData.get("durationMinutes")),
      };
      const data = await managementRequest(
        editingService
          ? `/api/services/${editingService.id}`
          : "/api/services",
        {
        method: editingService ? "PATCH" : "POST",
        body: JSON.stringify(servicePayload),
      });
      const refreshed = await managementRequest("/api/management/services");
      setServices(refreshed.services);
      form.reset();
      setEditingService(null);
      setNotice(
        `Service “${data.service.name}” was ${editingService ? "updated" : "added"}.`,
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPortfolioImage(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const formData = new FormData(form);
      const data = await managementRequest(
        editingImage
          ? `/api/management/portfolio/${editingImage.id}`
          : "/api/management/portfolio",
        {
        method: editingImage ? "PATCH" : "POST",
        body: JSON.stringify({
          imageUrl: formData.get("imageUrl"),
          altText: formData.get("altText"),
        }),
      });
      const refreshed = await managementRequest("/api/portfolio");
      setPortfolioImages(refreshed.images);
      form.reset();
      setEditingImage(null);
      setNotice(
        `Image “${data.image.altText || "Portfolio image"}” was ${editingImage ? "updated" : "added"}.`,
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteRecord(
    url,
    label,
    onDelete,
    confirmation = `Delete “${label}”? This cannot be undone.`,
  ) {
    if (!window.confirm(confirmation)) return;
    setError("");
    setNotice("");
    setLoading(true);

    try {
      await managementRequest(url, { method: "DELETE" });
      onDelete();
      setNotice(`“${label}” was deleted.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateAppointmentStatus(appointment, status) {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const data = await managementRequest(
        `/api/management/appointments/${appointment.id}`,
        { method: "PATCH", body: JSON.stringify({ status }) },
      );
      setAppointments((existing) =>
        existing.map((item) =>
          item.id === data.appointment.id
            ? { ...item, status: data.appointment.status }
            : item,
        ),
      );
      setNotice(`Appointment #${appointment.id} marked ${status}.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    setCredential("");
    setUserRole("");
    setPassword("");
    setAppointments([]);
    setCategories([]);
    setServices([]);
    setPortfolioImages([]);
    setEditingCategory(null);
    setEditingService(null);
    setEditingImage(null);
    setIsAuthenticated(false);
    setError("");
    setNotice("");
  }

  return (
    <main className="management">
      <div className="management-header">
        <div>
          <p className="management-eyebrow">DOYVES PLATS</p>
          <h1 className="management-title">Management dashboard</h1>
          <p className="management-description">
            {userRole === "Employee"
              ? "View appointment details."
              : "Manage appointments, services, categories, and portfolio images."}
          </p>
        </div>
        <div className="management-header-actions">
          {isAuthenticated && (
            <>
              {userRole === "Admin" && (
                <button
                  className={
                    isCreatingAccount
                      ? "management-sign-out"
                      : "management-create-account-button"
                  }
                  type="button"
                  onClick={() => {
                    setIsCreatingAccount((current) => !current);
                    setError("");
                  }}
                >
                  {isCreatingAccount ? "Cancel" : "Create account"}
                </button>
              )}
              <button
                className="management-sign-out"
                type="button"
                onClick={signOut}
              >
                Sign out
              </button>
            </>
          )}
          <a className="management-back-link" href="/">
            Back to website
          </a>
        </div>
      </div>

      {!isAuthenticated ? (
        <form className="management-access-form" onSubmit={handleLogin}>
          <h2>{isRegistering ? "Create management account" : "Sign in"}</h2>
          <label htmlFor="management-email">Email</label>
          <input
            id="management-email"
            type="email"
            autoComplete="username"
            maxLength={255}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <PasswordField
            id="management-password"
            label="Password"
            autoComplete={isRegistering ? "new-password" : "current-password"}
            minLength={isRegistering ? 12 : undefined}
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            visible={showPassword}
            onToggleVisibility={() =>
              setShowPassword((current) => !current)
            }
            required
          />
          {isRegistering && (
            <>
              <label htmlFor="management-bootstrap-key">
                One-time setup key
              </label>
              <input
                id="management-bootstrap-key"
                type="password"
                autoComplete="off"
                value={bootstrapKey}
                onChange={(event) => setBootstrapKey(event.target.value)}
                required
              />
              <p className="management-description">
                Enter the server’s ADMIN_API_KEY. This setup form is available
                only until the first management account is created.
              </p>
            </>
          )}
          {error && (
            <p className="management-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
          >
            {loading
              ? isRegistering
                ? "Creating account..."
                : "Signing in..."
              : isRegistering
                ? "Create account"
                : "Sign in"}
          </button>
          {registrationAvailable && (
            <button
              className="management-auth-toggle"
              type="button"
              disabled={loading || checkingRegistration}
              onClick={() => {
                setIsRegistering((current) => !current);
                setError("");
              }}
            >
              {isRegistering
                ? "Already set up? Sign in"
                : "First time here? Create the management account"}
            </button>
          )}
        </form>
      ) : (
        <>
          {isCreatingAccount && userRole === "Admin" && (
            <form
              className="management-access-form management-account-form"
              onSubmit={handleCreateAccount}
            >
              <h2>Create account</h2>
              <label htmlFor="new-account-email">Email</label>
              <input
                id="new-account-email"
                type="email"
                autoComplete="off"
                maxLength={255}
                value={newAccountEmail}
                onChange={(event) => setNewAccountEmail(event.target.value)}
                required
              />
              <PasswordField
                id="new-account-password"
                label="Password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                value={newAccountPassword}
                onChange={(event) => setNewAccountPassword(event.target.value)}
                visible={showNewAccountPassword}
                onToggleVisibility={() =>
                  setShowNewAccountPassword((current) => !current)
                }
                required
              />
              <label htmlFor="new-account-role">Role</label>
              <select
                id="new-account-role"
                value={newAccountRole}
                onChange={(event) => setNewAccountRole(event.target.value)}
              >
                <option value="Admin">Admin</option>
                <option value="Employee">Employee</option>
              </select>
              {error && (
                <p className="management-error" role="alert">
                  {error}
                </p>
              )}
              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>
          )}
          <div className="management-layout">
          <nav className="management-sidebar" aria-label="Management sections">
            {sections
              .filter(
                (section) =>
                  userRole === "Admin" || section.id === "appointments",
              )
              .map((section) => (
              <button
                className={`management-nav-button${selectedSection === section.id ? " active" : ""}`}
                key={section.id}
                type="button"
                aria-current={selectedSection === section.id ? "page" : undefined}
                onClick={() => chooseSection(section.id)}
              >
                {section.label}
              </button>
            ))}
          </nav>

          <section className="management-content">
            {selectedSection === "appointments" && (
              <>
                <div className="management-section-heading">
                  <div>
                    <p className="management-eyebrow">OVERVIEW</p>
                    <h2>Appointments</h2>
                  </div>
                  <p className="management-count">
                    <strong>{appointments.length}</strong>{" "}
                    {appointments.length === 1 ? "appointment" : "appointments"}
                  </p>
                </div>
                {loading ? (
                  <p className="management-empty" role="status">
                    Loading appointments...
                  </p>
                ) : appointments.length === 0 ? (
                  <p className="management-empty" role="status">
                    There are no appointments to show.
                  </p>
                ) : (
                  <div className="management-table-wrap">
                    <table className="management-table">
                      <thead>
                        <tr>
                          <th scope="col">ID</th>
                          <th scope="col">Customer</th>
                          <th scope="col">Contact</th>
                          <th scope="col">Service</th>
                          <th scope="col">Appointment</th>
                          <th scope="col">Price</th>
                          <th scope="col">Deposit</th>
                          <th scope="col">Status</th>
                          {userRole === "Admin" && (
                            <th scope="col">Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map((appointment) => (
                          <tr key={appointment.id}>
                            <td data-label="ID">{appointment.id}</td>
                            <td data-label="Customer">
                              {appointment.customerName}
                            </td>
                            <td data-label="Contact">
                              <a href={`mailto:${appointment.customerEmail}`}>
                                {appointment.customerEmail}
                              </a>
                              <a href={`tel:${appointment.customerPhone}`}>
                                {appointment.customerPhone}
                              </a>
                            </td>
                            <td data-label="Service">
                              {appointment.serviceName || "Service unavailable"}
                              {appointment.categoryName && (
                                <span className="management-category">
                                  {appointment.categoryName}
                                </span>
                              )}
                            </td>
                            <td data-label="Appointment">
                              {formatDateTime(appointment.appointmentDateTime)}
                            </td>
                            <td data-label="Price">
                              €{Number(appointment.servicePrice).toFixed(2)}
                            </td>
                            <td data-label="Deposit">
                              €{Number(appointment.depositAmount).toFixed(2)}
                            </td>
                            <td data-label="Status">
                              <span
                                className={`management-status management-status-${appointment.status}`}
                              >
                                {formatStatus(appointment.status)}
                              </span>
                            </td>
                            {userRole === "Admin" && (
                            <td data-label="Actions">
                              {["confirmed", "completed", "missed"].includes(
                                appointment.status,
                              ) && (
                                <div className="management-appointment-actions">
                                  <button
                                    type="button"
                                    disabled={loading || appointment.status === "completed"}
                                    onClick={() =>
                                      updateAppointmentStatus(appointment, "completed")
                                    }
                                  >
                                    Completed
                                  </button>
                                  <button
                                    type="button"
                                    disabled={loading || appointment.status === "missed"}
                                    onClick={() =>
                                      updateAppointmentStatus(appointment, "missed")
                                    }
                                  >
                                    Missed
                                  </button>
                                </div>
                              )}
                            </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {selectedSection === "category" && (
              <>
                <ManagementFormSection
                  key={editingCategory?.id ?? "new-category"}
                  eyebrow="SERVICES"
                  title={editingCategory ? "Edit category" : "Add new category"}
                  description="Create a category to organize bookable services."
                  onSubmit={handleCreateCategory}
                  loading={loading}
                  submitLabel={editingCategory ? "Save category" : "Add category"}
                >
                  <ManagementField
                    label="Category name"
                    name="name"
                    required
                    maxLength={100}
                    defaultValue={editingCategory?.name ?? ""}
                  />
                  {editingCategory && (
                    <button
                      className="management-cancel-edit"
                      type="button"
                      onClick={() => setEditingCategory(null)}
                    >
                      Cancel editing
                    </button>
                  )}
                </ManagementFormSection>
                <ManagementRecordList
                  title="All categories"
                  emptyMessage="No categories found."
                  items={categories.map((category) => ({
                    id: category.id,
                    title: category.name,
                    onEdit: () => setEditingCategory(category),
                    onDelete: () =>
                      deleteRecord(
                        `/api/categories/${category.id}`,
                        category.name,
                        () => {
                          setCategories((existing) =>
                            existing.filter((item) => item.id !== category.id),
                          );
                          if (editingCategory?.id === category.id) {
                            setEditingCategory(null);
                          }
                        },
                      ),
                  }))}
                />
              </>
            )}

            {selectedSection === "service" && (
              <>
                <ManagementFormSection
                  key={editingService?.id ?? "new-service"}
                  eyebrow="SERVICES"
                  title={editingService ? "Edit service" : "Add new service"}
                  description="Add a bookable service to an existing category."
                  onSubmit={handleCreateService}
                  loading={loading}
                  submitLabel={editingService ? "Save service" : "Add service"}
                >
                  <label className="management-field">
                    <span>Category</span>
                    <select
                      name="categoryId"
                      required
                      defaultValue={editingService?.categoryId ?? ""}
                    >
                      <option value="" disabled>
                        Select a category
                      </option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <ManagementField
                    label="Service name"
                    name="name"
                    required
                    maxLength={150}
                    defaultValue={editingService?.name ?? ""}
                  />
                  <ManagementField
                    label="Description"
                    name="description"
                    as="textarea"
                    maxLength={5000}
                    defaultValue={editingService?.description ?? ""}
                  />
                  <ManagementField
                    label="Price (€)"
                    name="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    defaultValue={editingService?.price ?? ""}
                  />
                  <ManagementField
                    label="Deposit (€)"
                    name="depositAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    defaultValue={editingService?.depositAmount ?? ""}
                  />
                  <ManagementField
                    label="Duration (minutes)"
                    name="durationMinutes"
                    type="number"
                    min="1"
                    step="1"
                    required
                    defaultValue={editingService?.durationMinutes ?? ""}
                  />
                  {categories.length === 0 && !loading && (
                    <p className="management-form-hint">
                      Add a category before creating a service.
                    </p>
                  )}
                  {editingService && (
                    <button
                      className="management-cancel-edit"
                      type="button"
                      onClick={() => setEditingService(null)}
                    >
                      Cancel editing
                    </button>
                  )}
                </ManagementFormSection>
                <ManagementRecordList
                  title="All services"
                  emptyMessage="No services found."
                  items={services.map((service) => ({
                    id: service.id,
                    title: service.name,
                    detail: `${service.categoryName} · €${Number(service.price).toFixed(2)} · ${service.durationMinutes} min`,
                    inactive: !service.isActive,
                    onEdit: () => setEditingService(service),
                    onDelete: () =>
                      deleteRecord(
                        `/api/services/${service.id}`,
                        service.name,
                        () => {
                          setServices((existing) =>
                            existing.map((item) =>
                              item.id === service.id
                                ? { ...item, isActive: false }
                                : item,
                            ),
                          );
                          if (editingService?.id === service.id) {
                            setEditingService(null);
                          }
                        },
                        `Remove “${service.name}” from customer booking? Existing appointments will be preserved.`,
                      ),
                    onRestore: async () => {
                      setError("");
                      setNotice("");
                      setLoading(true);
                      try {
                        await managementRequest(`/api/services/${service.id}/restore`, {
                          method: "POST",
                        });
                        setServices((existing) =>
                          existing.map((item) =>
                            item.id === service.id
                              ? { ...item, isActive: true }
                              : item,
                          ),
                        );
                        setNotice(`“${service.name}” is available again.`);
                      } catch (requestError) {
                        setError(requestError.message);
                      } finally {
                        setLoading(false);
                      }
                    },
                  }))}
                />
                <p className="management-form-hint">
                  Deleting a service removes it from customer booking but keeps its appointment history.
                </p>
              </>
            )}

            {selectedSection === "portfolio" && (
              <>
                <ManagementFormSection
                  key={editingImage?.id ?? "new-image"}
                  eyebrow="PORTFOLIO"
                  title={editingImage ? "Edit portfolio image" : "Add image to portfolio"}
                  description="Add an image by URL. It will appear alongside the existing placeholder images."
                  onSubmit={handleAddPortfolioImage}
                  loading={loading}
                  submitLabel={editingImage ? "Save image" : "Add image"}
                >
                  <ManagementField
                    label="Image URL"
                    name="imageUrl"
                    type="url"
                    placeholder="https://example.com/your-image.jpg"
                    required
                    maxLength={2048}
                    defaultValue={editingImage?.imageUrl ?? ""}
                  />
                  <ManagementField
                    label="Alternative text"
                    name="altText"
                    maxLength={200}
                    defaultValue={editingImage?.altText ?? ""}
                  />
                  {editingImage && (
                    <button
                      className="management-cancel-edit"
                      type="button"
                      onClick={() => setEditingImage(null)}
                    >
                      Cancel editing
                    </button>
                  )}
                </ManagementFormSection>
                <ManagementRecordList
                  title="All portfolio images"
                  emptyMessage="No database images found."
                  items={portfolioImages.map((image) => ({
                    id: image.id,
                    title: image.altText || "Portfolio image",
                    detail: image.imageUrl,
                    onEdit: () => setEditingImage(image),
                    onDelete: () =>
                      deleteRecord(
                        `/api/management/portfolio/${image.id}`,
                        image.altText || "Portfolio image",
                        () => {
                          setPortfolioImages((existing) =>
                            existing.filter((item) => item.id !== image.id),
                          );
                          if (editingImage?.id === image.id) {
                            setEditingImage(null);
                          }
                        },
                      ),
                  }))}
                />
              </>
            )}

            {error && (
              <p className="management-error management-feedback" role="alert">
                {error}
              </p>
            )}
            {notice && (
              <p className="management-notice" role="status">
                {notice}
              </p>
            )}
          </section>
          </div>
        </>
      )}
    </main>
  );
}

function ManagementFormSection({
  eyebrow,
  title,
  description,
  onSubmit,
  loading,
  submitLabel,
  children,
}) {
  return (
    <div className="management-form-section">
      <p className="management-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p className="management-form-description">{description}</p>
      <form className="management-data-form" onSubmit={onSubmit}>
        {children}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Saving..." : submitLabel}
        </button>
      </form>
    </div>
  );
}

function ManagementField({
  label,
  name,
  as = "input",
  type = "text",
  ...attributes
}) {
  const Field = as;
  return (
    <label className="management-field">
      <span>{label}</span>
      <Field
        name={name}
        type={as === "input" ? type : undefined}
        {...attributes}
      />
    </label>
  );
}

function ManagementRecordList({ title, emptyMessage, items }) {
  return (
    <div className="management-record-list">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="management-form-hint">{emptyMessage}</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li className="management-record" key={item.id}>
              <div className="management-record-details">
                <strong>
                  {item.title}
                  {item.inactive && (
                    <span className="management-inactive-label">Unavailable</span>
                  )}
                </strong>
                {item.detail && <span>{item.detail}</span>}
              </div>
              <div className="management-record-actions">
                {item.onRestore && item.inactive && (
                  <button
                    type="button"
                    className="management-icon-button"
                    aria-label={`Restore ${item.title}`}
                    title="Restore"
                    onClick={item.onRestore}
                  >
                    ↻
                  </button>
                )}
                <button
                  type="button"
                  className="management-icon-button"
                  aria-label={`Edit ${item.title}`}
                  title="Edit"
                  onClick={item.onEdit}
                >
                  ✎
                </button>
                {!item.inactive && (
                  <button
                    type="button"
                    className="management-icon-button management-delete-button"
                    aria-label={`Delete ${item.title}`}
                    title="Delete"
                    onClick={item.onDelete}
                  >
                    ×
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PasswordField({
  id,
  label,
  autoComplete,
  minLength,
  maxLength,
  value,
  onChange,
  visible,
  onToggleVisibility,
  required,
}) {
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <div className="management-password-field">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={maxLength}
          value={value}
          onChange={onChange}
          required={required}
        />
        <button
          className="management-password-toggle"
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={onToggleVisibility}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {!visible && <path d="m3 3 18 18" />}
          </svg>
        </button>
      </div>
    </>
  );
}

export default Management;
