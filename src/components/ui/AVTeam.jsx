import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, UserCircle, X, Trash2, Edit2 } from "lucide-react";
import MobileAVTeamCard from "./MobileAVTeamCard";
import useResponsive from "../../hooks/useResponsive";
import { useDebounce } from "../../hooks/useDebounce";
import { useAlertManager } from "../../hooks";
import { useConfirm } from "../../hooks/useConfirm";
import { LoadingSpinner, YearSelector } from "../shared";
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  logError,
  getErrorMessage,
} from "../../utils/errorHandler";
import {
  POLLING_INTERVAL,
  AV_ROTATION_MEMBERS,
  COLOR_THEMES,
  API_ENDPOINTS,
} from "../../lib/constants";
import {
  fetchWithTimeout,
  fetchWithRetry,
  parseJSON,
  apiPost,
  apiGet,
  apiDelete,
  apiPut,
} from "../../lib/api-utils";
import UserSelectionModal from "./UserSelectionModal";
import AddUserModal from "./AddUserModal";
import ServiceTimeModal from "./ServiceTimeModal";

const AVTeam = ({ selectedYear, setSelectedYear, availableYears }) => {
  const [assignments, setAssignments] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [allUsersIncludingDeleted, setAllUsersIncludingDeleted] = useState([]); // For editing past dates
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [usersToDelete, setUsersToDelete] = useState([]);
  // Track which position is being edited
  const [editingPosition, setEditingPosition] = useState(null); // { date, position, currentMember, serviceTime }
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [pendingActions, setPendingActions] = useState({}); // Track pending debounced actions
  const [showServiceTimeModal, setShowServiceTimeModal] = useState(false);
  const [serviceTimeForDate, setServiceTimeForDate] = useState({}); // Stores service times for dates: { "12/24/25": ["3:00 PM", "7:00 PM"] }

  // Refs for auto-scrolling to current date (consolidated for both views)
  const dateRefs = React.useRef({});
  const componentRootRef = React.useRef(null);

  // Add useResponsive and useAlertManager hooks
  const { isMobile } = useResponsive();
  const {
    showAlert,
    alertMessage,
    alertPosition,
    setAlertPosition,
    showAlertWithTimeout,
  } = useAlertManager();

  // Use confirm dialog hook
  const { confirm, ConfirmDialog } = useConfirm();

  // Centralized error and success handlers
  const handleError = useMemo(
    () => (error, additionalData, fallbackMessage) => {
      // Log the error properly
      logError("A/V Team", error, additionalData);

      // Get user-friendly message
      const message = getErrorMessage(
        error,
        fallbackMessage || ERROR_MESSAGES.API_ERROR,
      );

      // Show alert to user
      showAlertWithTimeout(message);
    },
    [showAlertWithTimeout],
  );

  const handleSuccess = useMemo(
    () => (message) => {
      showAlertWithTimeout(message);
    },
    [showAlertWithTimeout],
  );

  // Use rotation members from constants
  const rotationMembers = useMemo(() => AV_ROTATION_MEMBERS, []);

  // Helper to get assignment key (date or date|serviceTime)
  const getAssignmentKey = useCallback((date, serviceTime = null) => {
    return serviceTime ? `${date}|${serviceTime}` : date;
  }, []);

  // Helper to get assignment for a date/serviceTime
  const getAssignment = useCallback(
    (date, serviceTime = null) => {
      const key = getAssignmentKey(date, serviceTime);
      return assignments[key] || {};
    },
    [assignments, getAssignmentKey],
  );

  // Sprint 4.2: Dynamic dates from API
  const [dates, setDates] = useState([]);
  const [datesLoading, setDatesLoading] = useState(false);

  // Memoize rotation member calculation
  const getRotationMember = useCallback(
    (index) => {
      return rotationMembers[index % rotationMembers.length];
    },
    [rotationMembers],
  );

  // Sprint 4.2: Fetch dates dynamically based on selected year
  useEffect(() => {
    if (!selectedYear) return;

    const fetchDates = async () => {
      setDatesLoading(true);
      try {
        const response = await fetchWithTimeout(
          `/api/service-dates?year=${selectedYear}&upcomingOnly=false`,
        );

        if (!response.ok) {
          if (response.status === 404) {
            handleError(
              new Error(
                `Services for ${selectedYear} have not been generated yet.`,
              ),
              `Please generate services for ${selectedYear} in Settings > Calendar Manager.`,
            );
            setDates([]);
          } else {
            throw new Error("Failed to fetch service dates");
          }
          return;
        }

        const fetchedDates = await response.json();
        setDates(fetchedDates);
      } catch (error) {
        console.error("Error fetching dates for year:", selectedYear, error);
        handleError(error, "Error loading service dates");
        setDates([]);
      } finally {
        setDatesLoading(false);
      }
    };

    fetchDates();
  }, [selectedYear, handleError]);

  // Auto-scroll to current date when dates are loaded
  useEffect(() => {
    if (!dates.length || isLoading || datesLoading) return;

    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find the first date that is today or in the future
      const currentDateIndex = dates.findIndex((item) => {
        const [month, day, year] = item.date
          .split("/")
          .map((num) => parseInt(num, 10));
        // Use 2000 + year to match existing codebase pattern
        const itemDate = new Date(2000 + year, month - 1, day);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate >= today;
      });

      if (currentDateIndex !== -1) {
        const currentDate = dates[currentDateIndex].date;
        const targetElement = dateRefs.current[currentDate];

        if (targetElement) {
          if (isMobile) {
            // Mobile: Use scrollIntoView (works with scroll-margin-top CSS)
            targetElement.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          } else {
            // Desktop: Use scrollIntoView - browser handles optimal positioning
            targetElement.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }
      }
    }, 1000); // Increased delay to 1000ms for mobile DOM rendering

    return () => clearTimeout(timer);
  }, [dates, isLoading, datesLoading, isMobile]);

  // Consolidated data fetching - matches pattern from SignupSheet and WorshipTeam
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch users first
        const usersResponse = await fetchWithTimeout(API_ENDPOINTS.AV_USERS);
        if (!usersResponse.ok) throw new Error("Failed to fetch AV users");
        const existingUsers = await usersResponse.json();
        const currentUsers = Array.isArray(existingUsers) ? existingUsers : [];

        // Initialize required team members if they don't exist
        const initialMembers = ["Ben", "Doug", "Jaimes", "Laila", "Brett"];

        for (const member of initialMembers) {
          if (!currentUsers.some((user) => user.name === member)) {
            const addResponse = await fetchWithTimeout(API_ENDPOINTS.AV_USERS, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: member }),
            });
            if (!addResponse.ok) {
              console.error(`Failed to add user ${member}`);
            }
          }
        }

        // Fetch final user list
        const finalUsersResponse = await fetchWithTimeout(
          API_ENDPOINTS.AV_USERS,
        );
        if (!finalUsersResponse.ok)
          throw new Error("Failed to fetch final user list");
        const finalUsers = await finalUsersResponse.json();
        setAvailableUsers(Array.isArray(finalUsers) ? finalUsers : []);

        // Fetch assignments
        const assignmentsResponse = await fetchWithTimeout(
          API_ENDPOINTS.AV_TEAM,
        );
        if (!assignmentsResponse.ok)
          throw new Error("Failed to fetch assignments");
        const assignmentsData = await assignmentsResponse.json();

        if (assignmentsData.assignments) {
          // Group assignments by date+serviceTime composite key
          const assignmentsByKey = {};
          const serviceTimes = {};

          assignmentsData.assignments.forEach((curr) => {
            const serviceTime = curr.serviceTime || null;
            const key = serviceTime ? `${curr.date}|${serviceTime}` : curr.date;

            assignmentsByKey[key] = {
              team_member_1: curr.team_member_1,
              team_member_2: curr.team_member_2,
              team_member_3: curr.team_member_3,
              serviceTime: serviceTime,
            };

            // Track which dates have multiple service times
            // Only track dates that have explicit service times (not null)
            if (serviceTime) {
              if (!serviceTimes[curr.date]) {
                serviceTimes[curr.date] = [];
              }
              if (!serviceTimes[curr.date].includes(serviceTime)) {
                serviceTimes[curr.date].push(serviceTime);
              }
            }
          });

          // Sort service times for consistent display
          Object.keys(serviceTimes).forEach((date) => {
            serviceTimes[date].sort();
          });

          setAssignments(assignmentsByKey);
          setServiceTimeForDate(serviceTimes);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        handleError(error, "Error loading data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle user signup with useCallback optimization
  const handleSignup = useCallback(
    async (date, position = 3, userName, serviceTime = null) => {
      try {
        const key = serviceTime ? `${date}|${serviceTime}` : date;

        const response = await fetchWithTimeout(API_ENDPOINTS.AV_TEAM, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "signup",
            date,
            position,
            name: userName,
            serviceTime,
          }),
        });

        if (!response.ok) throw new Error("Failed to save signup");

        setAssignments((prev) => ({
          ...prev,
          [key]: {
            ...prev[key],
            team_member_3: userName,
            serviceTime,
          },
        }));

        handleSuccess("Successfully signed up!");
      } catch (error) {
        console.error("Error signing up:", error);
        handleError(error, "Error saving signup");
      }
    },
    [],
  );

  // Handle removing assignment with useCallback optimization
  const handleRemoveAssignment = useCallback(
    async (date, serviceTime = null) => {
      try {
        const key = serviceTime ? `${date}|${serviceTime}` : date;

        const response = await fetchWithTimeout(API_ENDPOINTS.AV_TEAM, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "signup",
            date,
            position: 3,
            name: null,
            serviceTime,
          }),
        });

        if (!response.ok) throw new Error("Failed to remove signup");

        setAssignments((prev) => {
          const newAssignments = { ...prev };
          if (newAssignments[key]) {
            delete newAssignments[key].team_member_3;
          }
          return newAssignments;
        });

        handleSuccess("Assignment removed successfully");
      } catch (error) {
        console.error("Error removing assignment:", error);
        handleError(error, "Error removing assignment");
      }
    },
    [],
  );

  // User management handlers
  const handleAddUser = () => {
    setShowAddUserModal(true);
  };

  const handleAddUserSubmit = async (name) => {
    try {
      await apiPost(API_ENDPOINTS.AV_USERS, { name });

      setAvailableUsers((prev) => [...prev, { name }]);
      setShowAddUserModal(false);
      handleSuccess(SUCCESS_MESSAGES.USER_ADDED);
    } catch (error) {
      handleError(
        error,
        { operation: "addUser", name },
        ERROR_MESSAGES.USER_ADD_ERROR,
      );
      throw error; // Re-throw to let modal handle error display
    }
  };

  // Handle adding service time to a date
  const handleAddServiceTime = useCallback(
    async (date, serviceTime) => {
      // Check if we need to migrate existing assignments from regular service
      const regularKey = getAssignmentKey(date, null);
      const regularAssignment = assignments[regularKey];
      const hasRegularAssignments =
        regularAssignment &&
        (regularAssignment.team_member_1 ||
          regularAssignment.team_member_2 ||
          regularAssignment.team_member_3);

      // Add service time to tracking
      setServiceTimeForDate((prev) => {
        const times = prev[date] || [];
        if (!times.includes(serviceTime)) {
          const newTimes = [...times, serviceTime].sort();

          // If this is the first service time and we have regular assignments, migrate them
          if (newTimes.length === 1 && hasRegularAssignments) {
            const newKey = getAssignmentKey(date, serviceTime);

            // Move assignment to new key
            setAssignments((prevAssignments) => {
              const { [regularKey]: oldAssignment, ...rest } = prevAssignments;
              return {
                ...rest,
                [newKey]: {
                  ...oldAssignment,
                  serviceTime,
                },
              };
            });

            // Save to database with new service time
            fetchWithTimeout(API_ENDPOINTS.AV_TEAM, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "signup",
                date,
                position: 1,
                name: regularAssignment.team_member_1,
                serviceTime,
              }),
            });
            if (regularAssignment.team_member_2) {
              fetchWithTimeout(API_ENDPOINTS.AV_TEAM, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "signup",
                  date,
                  position: 2,
                  name: regularAssignment.team_member_2,
                  serviceTime,
                }),
              });
            }
            if (regularAssignment.team_member_3) {
              fetchWithTimeout(API_ENDPOINTS.AV_TEAM, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "signup",
                  date,
                  position: 3,
                  name: regularAssignment.team_member_3,
                  serviceTime,
                }),
              });
            }

            // Delete old regular assignment from database
            fetchWithTimeout(API_ENDPOINTS.AV_TEAM, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ date, serviceTime: null }),
            });
          }

          return { ...prev, [date]: newTimes };
        }
        return prev;
      });
    },
    [assignments, getAssignmentKey, handleSuccess],
  );

  // Handle removing service time from a date
  const handleRemoveServiceTime = useCallback(
    async (date, serviceTime) => {
      const key = getAssignmentKey(date, serviceTime);

      // Remove from state
      setServiceTimeForDate((prev) => {
        const times = (prev[date] || []).filter((t) => t !== serviceTime);
        if (times.length === 0) {
          const { [date]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [date]: times };
      });

      // Remove assignment from state
      setAssignments((prev) => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });

      // Delete from database if assignment exists
      try {
        await fetchWithTimeout(API_ENDPOINTS.AV_TEAM, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, serviceTime }),
        });
      } catch (error) {
        console.error("Error deleting service time assignment:", error);
        // Non-critical error - assignment may not exist in DB yet
      }

      handleSuccess(`Service time ${serviceTime} removed from ${date}`);
    },
    [getAssignmentKey, handleSuccess],
  );

  // Handle assignment updates with useCallback optimization
  const handleAssignment = useCallback(
    async (date, position, name, serviceTime = null) => {
      const key = serviceTime ? `${date}|${serviceTime}` : date;

      // Store previous state for rollback
      const previousAssignment = assignments[key]?.[`team_member_${position}`];

      // OPTIMISTIC UPDATE: Update UI immediately
      setAssignments((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          [`team_member_${position}`]: name,
          serviceTime,
        },
      }));

      try {
        const response = await fetchWithTimeout(API_ENDPOINTS.AV_TEAM, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "signup",
            date,
            position,
            name,
            serviceTime,
          }),
        });

        if (!response.ok) throw new Error("Failed to update assignment");

        handleSuccess(SUCCESS_MESSAGES.ASSIGNMENT_SAVED);
      } catch (error) {
        // ROLLBACK: Restore previous state on error
        setAssignments((prev) => ({
          ...prev,
          [key]: {
            ...prev[key],
            [`team_member_${position}`]: previousAssignment,
          },
        }));

        handleError(
          error,
          { operation: "updateAssignment", date, position },
          ERROR_MESSAGES.ASSIGNMENT_ERROR,
        );
      } finally {
        // Clear pending state
        setPendingActions((prev) => {
          const newState = { ...prev };
          delete newState[`assignment-${date}-${position}`];
          return newState;
        });
      }
    },
    [assignments, handleSuccess, handleError],
  ); // Add error handlers

  // Debounced version of handleAssignment
  const [debouncedAssignment] = useDebounce(
    (date, position, name, serviceTime = null) => {
      const key = serviceTime ? `${date}|${serviceTime}` : date;
      setPendingActions((prev) => ({
        ...prev,
        [`assignment-${key}-${position}`]: true,
      }));
      handleAssignment(date, position, name, serviceTime);
    },
    300,
  );

  // Check if date is in the past with useCallback optimization
  const isPastDate = useCallback((dateStr) => {
    const [month, day, year] = dateStr.split("/").map(Number);
    const dateToCheck = new Date(2000 + year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dateToCheck < today;
  }, []);

  // Handle user selection from modal with useCallback optimization
  const handleUserSelect = useCallback(
    (userName) => {
      if (!editingPosition) return;

      const { date, position, serviceTime } = editingPosition;

      if (position === 3) {
        handleSignup(date, position, userName, serviceTime);
      } else {
        debouncedAssignment(date, position, userName, serviceTime);
      }

      // Close the modal
      setEditingPosition(null);
    },
    [editingPosition, handleSignup, debouncedAssignment],
  );

  // Handle deletion from modal with useCallback optimization
  const handleDeleteFromModal = useCallback(() => {
    if (!editingPosition || editingPosition.position !== 3) return;

    const { date, serviceTime } = editingPosition;
    handleRemoveAssignment(date, serviceTime);

    // Close the modal
    setEditingPosition(null);
  }, [editingPosition, handleRemoveAssignment]);

  // Fetch all users including deleted ones when editing past dates
  const fetchAllUsers = useCallback(async () => {
    try {
      const response = await fetchWithTimeout(
        `${API_ENDPOINTS.AV_USERS}?includeDeleted=true`,
      );
      if (!response.ok) throw new Error("Failed to fetch all users");
      const users = await response.json();
      setAllUsersIncludingDeleted(Array.isArray(users) ? users : []);
    } catch (error) {
      console.error("Error fetching all users:", error);
      handleError(error, "Error loading user list");
    }
  }, [handleError]);

  // Load all users including deleted ones on component mount
  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  // Helper function to render a row for a specific service time (or null for regular service)
  const renderServiceTimeRow = (
    item,
    index,
    serviceTime = null,
    isFirstOfMultiple = false,
    isPartOfMultiple = false,
  ) => {
    const assignment = getAssignment(item.date, serviceTime);
    const key = getAssignmentKey(item.date, serviceTime);
    const displayTitle = serviceTime
      ? `${item.title} - ${serviceTime}`
      : item.title;
    const allTimesForDate = serviceTimeForDate[item.date] || [];

    return (
      <tr
        key={key}
        ref={
          serviceTime === null || isFirstOfMultiple
            ? (el) => (dateRefs.current[item.date] = el)
            : undefined
        }
        style={{ scrollMarginTop: "60px" }}
        className={`${index % 2 === 0 ? "bg-gray-50" : ""} ${isPartOfMultiple && !isFirstOfMultiple ? "border-t-0" : ""}`}
      >
        {/* Date column - only show on first row of multi-service dates */}
        <td
          style={{ width: "110px" }}
          className={`p-2 border-r border-gray-300 text-center ${isPartOfMultiple && !isFirstOfMultiple ? "border-t-0" : ""}`}
        >
          {isFirstOfMultiple || !isPartOfMultiple ? (
            <>
              {item.date}
              {isFirstOfMultiple && allTimesForDate.length > 1 && (
                <div className="text-xs text-red-600 font-medium mt-1">
                  {allTimesForDate.length} services
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-400 text-xs">↳</div>
          )}
        </td>
        {/* Day column - only show on first row of multi-service dates */}
        <td
          style={{ width: "120px" }}
          className={`p-2 border-r border-gray-300 text-center ${isPartOfMultiple && !isFirstOfMultiple ? "border-t-0" : ""}`}
        >
          {isFirstOfMultiple || !isPartOfMultiple ? item.day : ""}
        </td>
        <td style={{ width: "35%" }} className="p-2 border-r border-gray-300">
          {displayTitle}
        </td>
        <td style={{ width: "16%" }} className="p-2 border-r border-gray-300">
          <div
            className={`p-2 rounded bg-red-700 ${isPastDate(item.date) ? "opacity-50" : "bg-opacity-20"} flex justify-between items-center`}
          >
            <span className="flex-1 text-center pr-2">
              {assignment?.team_member_1 || "Ben"}
            </span>
            <button
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setAlertPosition({
                  x: rect.left + rect.width / 2,
                  y: rect.top,
                });
                setEditingPosition({
                  date: item.date,
                  position: 1,
                  currentMember: assignment?.team_member_1 || "Ben",
                  serviceTime,
                });
              }}
              className="text-red-500 hover:text-red-700 flex-shrink-0"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </td>
        <td style={{ width: "16%" }} className="p-2 border-r border-gray-300">
          <div
            className={`p-2 rounded bg-red-700 ${isPastDate(item.date) ? "opacity-50" : "bg-opacity-20"} flex justify-between items-center`}
          >
            <span className="flex-1 text-center pr-2">
              {assignment?.team_member_2 || getRotationMember(index)}
            </span>
            <button
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setAlertPosition({
                  x: rect.left + rect.width / 2,
                  y: rect.top,
                });
                setEditingPosition({
                  date: item.date,
                  position: 2,
                  currentMember:
                    assignment?.team_member_2 || getRotationMember(index),
                  serviceTime,
                });
              }}
              className="text-red-500 hover:text-red-700 flex-shrink-0"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </td>
        <td style={{ width: "16%" }} className="p-2">
          {assignment?.team_member_3 ? (
            <div
              className={`p-2 rounded bg-red-700 ${isPastDate(item.date) ? "opacity-50" : "bg-opacity-20"} flex justify-between items-center`}
            >
              <span className="flex-1 text-center pr-2">
                {assignment.team_member_3}
              </span>
              <button
                onClick={() => handleRemoveAssignment(item.date, serviceTime)}
                className="text-red-500 hover:text-red-700 flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setAlertPosition({
                  x: rect.left + rect.width / 2,
                  y: rect.top,
                });
                setEditingPosition({
                  date: item.date,
                  position: 3,
                  serviceTime,
                });
              }}
              className={`w-full p-2 border rounded text-red-700 border-red-700 hover:bg-red-50 ${
                isPastDate(item.date) ? "opacity-50" : ""
              }`}
            >
              Sign Up
            </button>
          )}
        </td>
      </tr>
    );
  };

  return (
    <Card
      ref={componentRootRef}
      className="w-full h-full mx-auto relative bg-white shadow-lg"
    >
      {showAlert && (
        <Alert
          className="fixed z-[60] w-80 bg-white border-red-700 shadow-lg rounded-lg"
          style={{
            top: `${alertPosition.y}px`,
            left: `${alertPosition.x}px`,
            transform: "translate(-50%, -120%)",
          }}
        >
          <div className="flex items-center gap-2 p-2">
            <Mail className="w-5 h-5 text-red-700" />
            <AlertDescription className="text-black font-medium">
              {alertMessage}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="flex flex-col h-full">
        {/* Sticky Header Section */}
        <div className="sticky top-0 z-10 bg-white">
          <CardHeader className="border-b border-gray-200">
            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-center gap-12">
              <img
                src="/church-logo.png"
                alt="Church Logo"
                className="h-28 object-contain"
              />
              <div>
                <h1 className="text-3xl font-bold text-center text-red-700">
                  Audio/Video Team
                </h1>
                <div className="flex items-center justify-center mt-2">
                  <YearSelector
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                    availableYears={availableYears}
                    teamColor="#DC2626"
                    textSize="text-2xl"
                  />
                </div>
              </div>
              <img
                src="/ZionSyncLogo.png"
                alt="ZionSync Logo"
                className="h-28 object-contain"
              />
            </div>

            {/* Mobile Header */}
            <div className="flex md:hidden flex-col gap-4">
              <div className="flex justify-center gap-4 mb-2">
                <div className="flex gap-2 items-center">
                  <img
                    src="/church-logo.png"
                    alt="Church Logo"
                    className="h-10 object-contain"
                  />
                  <img
                    src="/ZionSyncLogo.png"
                    alt="ZionSync Logo"
                    className="h-10 object-contain"
                  />
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold text-red-700">
                  Audio/Video Team
                </h1>
                <div className="flex items-center justify-center mt-2">
                  <YearSelector
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                    availableYears={availableYears}
                    teamColor="#DC2626"
                    textSize="text-lg"
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Simplified header with Manage Users button */}
          <div className="p-4 border-b border-gray-200 flex justify-end gap-2">
            <button
              onClick={() => setShowServiceTimeModal(true)}
              className="px-3 py-2 rounded border border-red-700 text-red-700 hover:bg-red-50"
            >
              Manage Service Times
            </button>
            <button
              onClick={() => setShowUserManagement(true)}
              className="px-3 py-2 rounded border border-red-700 text-red-700 hover:bg-red-50"
            >
              Manage Users
            </button>
          </div>
        </div>

        {/* Scrollable Content Section */}
        <div className="flex-1 overflow-hidden">
          <CardContent className="h-full p-0">
            {isLoading || datesLoading ? (
              <LoadingSpinner
                message={
                  datesLoading
                    ? `Loading ${selectedYear} services...`
                    : "Loading A/V Team schedule..."
                }
                color="red-700"
              />
            ) : dates.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-gray-600 text-lg mb-2">
                    No services found for {selectedYear}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Services may not be generated yet.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full">
                {/* Desktop Table View */}
                <div className="hidden md:block h-full">
                  <div className="relative h-full">
                    <div className="overflow-y-auto h-full">
                      <table className="w-full">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-[#FFEBEB]">
                            <th
                              style={{ width: "110px" }}
                              className="p-2 text-center font-bold text-red-700"
                            >
                              Date
                            </th>
                            <th
                              style={{ width: "120px" }}
                              className="p-2 text-center font-bold text-red-700"
                            >
                              Day
                            </th>
                            <th
                              style={{ width: "35%" }}
                              className="p-2 text-left font-bold text-red-700"
                            >
                              Service
                            </th>
                            <th
                              style={{ width: "16%" }}
                              className="p-2 text-center font-bold text-red-700"
                            >
                              Team Member 1
                            </th>
                            <th
                              style={{ width: "16%" }}
                              className="p-2 text-center font-bold text-red-700"
                            >
                              Team Member 2
                            </th>
                            <th
                              style={{ width: "16%" }}
                              className="p-2 text-center font-bold text-red-700"
                            >
                              Team Member 3
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {dates.map((item, index) => {
                            const serviceTimes = serviceTimeForDate[item.date];

                            // If date has multiple service times, render a row for each
                            if (serviceTimes && serviceTimes.length > 0) {
                              return serviceTimes.map((serviceTime, stIndex) =>
                                renderServiceTimeRow(
                                  item,
                                  index,
                                  serviceTime,
                                  stIndex === 0,
                                  true,
                                ),
                              );
                            }

                            // Otherwise, render a single row (regular service)
                            return renderServiceTimeRow(
                              item,
                              index,
                              null,
                              false,
                              false,
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Mobile View */}
                {isMobile && (
                  <div className="p-4 overflow-y-auto h-full">
                    {dates.map((item, index) => {
                      const serviceTimes = serviceTimeForDate[item.date];

                      // If date has multiple service times, render a card for each
                      if (serviceTimes && serviceTimes.length > 0) {
                        return serviceTimes.map((serviceTime, stIndex) => (
                          <div
                            key={`${item.date}|${serviceTime}`}
                            ref={
                              stIndex === 0
                                ? (el) => (dateRefs.current[item.date] = el)
                                : undefined
                            }
                            style={{ scrollMarginTop: "20px" }}
                          >
                            <MobileAVTeamCard
                              item={item}
                              index={index}
                              assignments={assignments}
                              rotationMembers={rotationMembers}
                              isPastDate={isPastDate}
                              serviceTime={serviceTime}
                              getAssignment={getAssignment}
                              onSignup={(date, serviceTime) => {
                                setEditingPosition({
                                  date,
                                  position: 3,
                                  serviceTime,
                                });
                              }}
                              onRemoveAssignment={handleRemoveAssignment}
                              onEditMember={(
                                date,
                                position,
                                currentMember,
                                serviceTime,
                              ) => {
                                setEditingPosition({
                                  date,
                                  position,
                                  currentMember,
                                  serviceTime,
                                });
                              }}
                              showAlertWithTimeout={showAlertWithTimeout}
                              setAlertPosition={setAlertPosition}
                            />
                          </div>
                        ));
                      }

                      // Otherwise, render a single card (regular service)
                      return (
                        <div
                          key={item.date}
                          ref={(el) => (dateRefs.current[item.date] = el)}
                          style={{ scrollMarginTop: "20px" }}
                        >
                          <MobileAVTeamCard
                            item={item}
                            index={index}
                            assignments={assignments}
                            rotationMembers={rotationMembers}
                            isPastDate={isPastDate}
                            serviceTime={null}
                            getAssignment={getAssignment}
                            onSignup={(date) => {
                              setEditingPosition({
                                date,
                                position: 3,
                                serviceTime: null,
                              });
                            }}
                            onRemoveAssignment={handleRemoveAssignment}
                            onEditMember={(date, position, currentMember) => {
                              setEditingPosition({
                                date,
                                position,
                                currentMember,
                                serviceTime: null,
                              });
                            }}
                            showAlertWithTimeout={showAlertWithTimeout}
                            setAlertPosition={setAlertPosition}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </div>
      </div>

      {/* User Management Modal */}
      {showUserManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-700">Manage Users</h2>
              <button
                onClick={() => {
                  setShowUserManagement(false);
                  setUsersToDelete([]);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <button
                onClick={handleAddUser}
                className="w-full px-3 py-2 rounded border border-red-700 text-red-700 hover:bg-red-50"
              >
                + Add New User
              </button>
              <div className="space-y-2">
                {availableUsers.map((user) => (
                  <div
                    key={user.name}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                  >
                    <span className="text-gray-900">{user.name}</span>
                    <button
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: "Remove User",
                          message: `Remove ${user.name} from the A/V team?`,
                          details: [
                            "This will permanently delete them from the users list",
                          ],
                          variant: "danger",
                          confirmText: "Remove",
                          cancelText: "Cancel",
                        });

                        if (confirmed) {
                          try {
                            await apiDelete(API_ENDPOINTS.AV_USERS, {
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ name: user.name }),
                            });

                            setAvailableUsers((prev) =>
                              prev.filter((u) => u.name !== user.name),
                            );
                            handleSuccess("User removed successfully");
                          } catch (error) {
                            console.error("Error removing user:", error);
                            handleError(error, "Error removing user");
                          }
                        }
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Selection Modal */}
      {editingPosition && (
        <UserSelectionModal
          showModal={editingPosition !== null}
          onClose={() => setEditingPosition(null)}
          availableUsers={
            editingPosition.date && isPastDate(editingPosition.date)
              ? allUsersIncludingDeleted
              : availableUsers
          }
          initialUserName={editingPosition.currentMember}
          onSelect={handleUserSelect}
          onDelete={handleDeleteFromModal}
          title={
            editingPosition.serviceTime
              ? `${editingPosition.position === 3 ? "Sign Up" : `Edit Team Member ${editingPosition.position}`} - ${editingPosition.serviceTime}`
              : editingPosition.position === 3
                ? "Sign Up for Service"
                : `Edit Team Member ${editingPosition.position}`
          }
          showDeleteButton={
            editingPosition.position === 3 && !!editingPosition.currentMember
          }
          currentAssignments={
            editingPosition.date
              ? getAssignment(editingPosition.date, editingPosition.serviceTime)
              : {}
          }
          currentPosition={editingPosition.position}
          isPastDate={
            editingPosition.date ? isPastDate(editingPosition.date) : false
          }
        />
      )}

      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSubmit={handleAddUserSubmit}
        teamColor="#DC2626"
        teamName="A/V"
      />

      {/* Service Time Management Modal */}
      <ServiceTimeModal
        isOpen={showServiceTimeModal}
        onClose={() => setShowServiceTimeModal(false)}
        dates={dates}
        serviceTimeForDate={serviceTimeForDate}
        assignments={assignments}
        onAddServiceTime={handleAddServiceTime}
        onRemoveServiceTime={handleRemoveServiceTime}
        getAssignmentKey={getAssignmentKey}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog />
    </Card>
  );
};

export default AVTeam;
