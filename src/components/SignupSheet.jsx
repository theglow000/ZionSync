'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Check, X, Mail, UserCircle, Trash2, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import './ui/table.css'

const SignupSheet = () => {
  // Initialize all state at the top of component
  const [currentUser, setCurrentUser] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [showRegistration, setShowRegistration] = useState(false);
  const [signups, setSignups] = useState({});
  const [currentDate, setCurrentDate] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [completed, setCompleted] = useState({});
  const [selectedDates, setSelectedDates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [signupDetails, setSignupDetails] = useState({});  // Add this near other state declarations
  const [availableUsers, setAvailableUsers] = useState([])
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [usersToDelete, setUsersToDelete] = useState([]);

  const isFutureDate = (dateStr) => {
    const [month, day, year] = dateStr.split('/').map(num => parseInt(num, 10));
    // Set time to start of day for accurate comparison
    const dateToCheck = new Date(year, month - 1, day);
    dateToCheck.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return dateToCheck >= today;
  };

  const handleAddUser = async () => {
    const name = prompt('Enter new user name:');
    if (name) {
      try {
        await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name })
        });
        
        setAvailableUsers(prev => [...prev, { name }]);
      } catch (error) {
        console.error('Error adding user:', error);
        setAlertMessage('Error adding user');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      }
    }
  };
  
  const handleRemoveUser = async (userName, skipConfirm = true) => {
    if (!skipConfirm && !confirm(`Remove ${userName} from users list?`)) {
      return;
    }

    try {
      await fetch('/api/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: userName })
      });

      setAvailableUsers(prev => prev.filter(user => user.name !== userName));

      // Clear signups for this user
      setSignups(prev => {
        const newSignups = { ...prev };
        Object.entries(newSignups).forEach(([date, name]) => {
          if (name === userName) {
            delete newSignups[date];
          }
        });
        return newSignups;
      });

      // If current user was deleted, clear current user
      if (currentUser?.name === userName) {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Error removing user:', error);
      setAlertMessage('Error removing user');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  };

// Fetch all signups and service details when component mounts
useEffect(() => {
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch users first
      const usersResponse = await fetch('/api/users');
      const usersData = await usersResponse.json();
      setAvailableUsers(usersData);
      // Fetch signups
      const signupsResponse = await fetch('/api/signups');
      const signupsData = await signupsResponse.json();
      console.log('Fetched signups:', signupsData);
      // Convert array to object format for signups and details
      const signupsObj = {};
      const detailsObj = {};
      const userFutureDates = [];
      signupsData.forEach(signup => {
        signupsObj[signup.date] = signup.name;
        detailsObj[signup.date] = {
          name: signup.name
        };
      // Only select future dates for the current user
      if (isFutureDate(signup.date)) {
        userFutureDates.push(signup.date);
      }
    });
    setSignups(signupsObj);
    setSignupDetails(detailsObj);        
    setSelectedDates(userFutureDates);
      
      
      console.log('Signup Details Object:', detailsObj);
      setSignups(signupsObj);
      setSignupDetails(detailsObj);

      // Fetch completed status
      const completedResponse = await fetch('/api/completed');
      const completedData = await completedResponse.json();
      const completedObj = {};
      completedData.forEach(item => {
        completedObj[item.date] = item.completed;
      });
      setCompleted(completedObj);

      // Find the user's signups (keeping your error handling)
      const userSignups = signupsData.filter(signup => signupsObj[signup.date] === signup.name);
      if (userSignups.length > 0) {
        const userSignup = userSignups[0];
        setCurrentUser({
          name: userSignup.name,
          color: 'bg-[#6B8E23] bg-opacity-20'
        });
      }

      // Fetch service details (keeping your version with default empty strings)
      const detailsResponse = await fetch('/api/service-details');
      const detailsData = await detailsResponse.json();
      
      const serviceDetailsObj = {};
      detailsData.forEach(detail => {
        serviceDetailsObj[detail.date] = {
          sermonTitle: detail.sermonTitle || '',
          gospelReading: detail.gospelReading || '',
          hymnOne: detail.hymnOne || '',
          sermonHymn: detail.sermonHymn || '',
          closingHymn: detail.closingHymn || '',
          notes: detail.notes || ''
        };
      });
      setServiceDetails(serviceDetailsObj);

    } catch (error) {
      console.error('Error fetching data:', error);
      setAlertMessage('Error loading data. Please refresh the page.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, []); // Empty dependency array means this runs once when component mounts

  const dates = [
    { date: '1/5/25', day: 'Sunday', title: 'Epiphany' },
    { date: '1/12/25', day: 'Sunday', title: 'Baptism of our Lord' },
    { date: '1/19/25', day: 'Sunday', title: 'Epiphany Week 2' },
    { date: '1/26/25', day: 'Sunday', title: 'Epiphany Week 3' },
    { date: '2/2/25', day: 'Sunday', title: 'Presentation of Our Lord' },
    { date: '2/9/25', day: 'Sunday', title: 'Epiphany Week 5' },
    { date: '2/16/25', day: 'Sunday', title: 'Epiphany Week 6' },
    { date: '2/23/25', day: 'Sunday', title: 'Epiphany Week 7' },
    { date: '3/2/25', day: 'Sunday', title: 'The Transfiguration of Our Lord' },
    { date: '3/5/25', day: 'Wednesday', title: 'Ash Wednesday' },
    { date: '3/9/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '3/12/25', day: 'Wednesday', title: 'Lent Worship' },
    { date: '3/16/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '3/19/25', day: 'Wednesday', title: 'Lent Worship' },
    { date: '3/23/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '3/26/25', day: 'Wednesday', title: 'Lent Worship' },
    { date: '3/30/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '4/2/25', day: 'Wednesday', title: 'Lent Worship' },
    { date: '4/6/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '4/9/25', day: 'Wednesday', title: 'Lent Worship' },
    { date: '4/13/25', day: 'Sunday', title: 'Palm Sunday' },
    { date: '4/17/25', day: 'Thursday', title: 'Maundy Thursday' },
    { date: '4/18/25', day: 'Friday', title: 'Good Friday' },
    { date: '4/20/25', day: 'Sunday', title: 'Easter Sunday' },
    { date: '4/27/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '5/4/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '5/11/25', day: 'Sunday', title: 'Mother\'s Day' },
    { date: '5/18/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '5/25/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '6/1/25', day: 'Sunday', title: 'VBS Week' },
    { date: '6/8/25', day: 'Sunday', title: 'Confirmation Sunday' },
    { date: '6/15/25', day: 'Sunday', title: 'Father\'s Day' },
    { date: '6/22/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '6/29/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '7/6/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '7/13/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '7/20/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '7/27/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '8/3/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '8/10/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '8/17/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '8/24/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '8/31/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '9/7/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '9/14/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '9/21/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '9/28/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '10/5/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '10/12/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '10/19/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '10/26/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '11/2/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '11/9/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '11/16/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '11/23/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '11/26/25', day: 'Wednesday', title: 'Thanksgiving Eve' },
    { date: '11/30/25', day: 'Sunday', title: 'Advent 1' },
    { date: '12/7/25', day: 'Sunday', title: 'Advent 2' },
    { date: '12/14/25', day: 'Sunday', title: 'Advent 3' },
    { date: '12/21/25', day: 'Sunday', title: 'Advent 4 (Kid\'s Christmas Program)' },
    { date: '12/24/25', day: 'Wednesday', title: 'Christmas Eve Services (3pm & 7pm)' },
    { date: '12/28/25', day: 'Sunday', title: 'Christmas Week 1' }
  ];

  const [serviceDetails, setServiceDetails] = useState({});

  const handleSignup = async () => {
    const nameInput = document.querySelector('input[name="name"]');
    
    if (!nameInput) return;
    
    const name = nameInput.value;
    
    if (!name) return;
  
    try {
      // Save to MongoDB
      await fetch('/api/signups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: currentDate,
          name,
        })
      });
  
      const newUser = {
        name,
        color: 'bg-[#6B8E23] bg-opacity-20'
      };
  
      // Update both signups and signupDetails states
      setSignups(prev => ({
        ...prev,
        [currentDate]: name
      }));
  
      setSignupDetails(prev => ({
        ...prev,
        [currentDate]: {
          name
        }
      }));
  
      setCurrentUser(newUser);
      setSelectedDates(prev => [...prev, currentDate]);
      setShowRegistration(false);
      setAlertMessage('Successfully signed up! Date added to calendar selection.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } catch (error) {
      setAlertMessage('Error saving signup. Please try again.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  };
  
  const handleServiceDetailChange = async (date, field, value) => {
    try {
      // Update local state immediately for responsive typing
      setServiceDetails(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          [field]: value
        }
      }));
  
      // Debounce the API call
      const timeoutId = setTimeout(async () => {
        const updatedDetails = {
          ...serviceDetails[date],
          [field]: value,
          date
        };
  
        // Save to MongoDB
        await fetch('/api/service-details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedDetails)
        });
      }, 500); // Wait 500ms after typing stops before saving
  
      return () => clearTimeout(timeoutId);
    } catch (error) {
      setAlertMessage('Error saving service details. Please try again.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  };

  const handleRemoveReservation = async (date) => {
    if (!currentUser) return;
    
    if (signups[date] === currentUser.name) {
      try {
        await fetch('/api/signups', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: date,
            name: currentUser.name
          })
        });
  
        setSignups(prev => {
          const newSignups = { ...prev };
          delete newSignups[date];
          return newSignups;
        });
  
        setSignupDetails(prev => {
          const newDetails = { ...prev };
          delete newDetails[date];
          return newDetails;
        });
  
        setSelectedDates(prev => prev.filter(d => d !== date));
        setAlertMessage('Reservation removed successfully');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      } catch (error) {
        setAlertMessage('Error removing reservation. Please try again.');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      }
    }
  };

  const handleCompleted = async (date) => {
    const newValue = !completed[date];
    try {
      await fetch('/api/completed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          completed: newValue
        })
      });
      
      setCompleted(prev => ({
        ...prev,
        [date]: newValue
      }));
    } catch (error) {
      console.error('Error updating completed status:', error);
    }
  };

  const handleCalendarDownload = async () => {
    try {
      // Filter the dates array to only include selected dates
      const userSelectedDates = selectedDates.filter(date => signups[date] === currentUser?.name);
      const eventsToDownload = dates.filter(date => userSelectedDates.includes(date.date));
  
      // Create events array for ICS
      const events = eventsToDownload.map(event => {
        const [month, day, parsedYear] = event.date.split('/').map(num => parseInt(num, 10));
        const year = 2000 + parsedYear; // Fix the year issue
        
        return {
          uid: `proclaim-presentation-${event.date}`,
          start: [year, month, day, 9, 0], // Assuming 9 AM start time
          duration: { hours: 1, minutes: 0 }, // Assuming 1 hour duration
          title: `Proclaim Presentation - ${event.title}`,
          description: 'Thank you for signing up to build the Proclaim Presentation for this service.',
          url: 'https://your-website-url.com', // Replace with actual URL when deployed
          alarms: [{
            action: 'display',
            trigger: { days: 3, before: true },
            description: 'Reminder: Proclaim presentation'
          }]
        };
      });

      // Generate ICS file content
      const { error, value } = await new Promise((resolve) => {
        import('ics').then(ics => {
          ics.createEvents(events, (error, value) => {
            resolve({ error, value });
          });
        });
      });
  
      if (error) {
        throw error;
      }
  
      // Create and download the file
      const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'proclaim-presentations.ics';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
      setAlertMessage('Calendar events downloaded successfully');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } catch (error) {
      console.error('Error creating calendar file:', error);
      setAlertMessage('Error creating calendar file. Please try again.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto relative bg-white shadow-lg">
      {showAlert && (
        <Alert className="absolute top-4 right-4 w-96 bg-[#FFD700] bg-opacity-20 border-[#6B8E23]">
        <Mail className="w-4 h-4 text-[#6B8E23]" />
        <AlertDescription className="text-black font-medium">{alertMessage}</AlertDescription>
      </Alert>
      )}

      {showRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#6B8E23]">Sign Up for Service</h2>
              <button 
                onClick={() => setShowRegistration(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-black">Name</label>
                <input
                  required
                  name="name"
                  type="text"
                  className="w-full p-2 border rounded text-black"
                  placeholder="Enter your name"
                  defaultValue={currentUser?.name || ''}
                />
              </div>
              <button
                onClick={handleSignup}
                className="w-full bg-[#6B8E23] text-white p-2 rounded hover:bg-[#556B2F] transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      )}

      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-center gap-8">
          <img
            src="/church-logo.png"
            alt="Church Logo"
            className="h-16 object-contain"
          />
          <div>
            <h1 className="text-3xl font-bold text-center text-[#6B8E23]">Proclaim Presentation Team Sign-up Sheet</h1>
            <p className="text-2xl font-bold text-center text-gray-600">2025 Service Schedule</p>
          </div>
          <img
            src="/proclaim-logo.png"
            alt="Church Logo"
            className="h-16 object-contain"
          />
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex justify-between items-center mb-4">
         <div className="flex items-center gap-2">
           {selectedDates.length > 0 && currentUser && (
             <>
               <button
                 onClick={handleCalendarDownload}
                 className="flex items-center px-4 py-2 bg-[#6B8E23] text-white rounded hover:bg-[#556B2F] transition-colors"
               >
                 <Calendar className="w-4 h-4 mr-2" />
                 Download {selectedDates.filter(date => signups[date] === currentUser?.name).length} Calendar Events
               </button>
               <div className="relative group">
                 <button className="w-6 h-6 rounded-full bg-[#6B8E23] bg-opacity-20 text-[#6B8E23] flex items-center justify-center font-bold hover:bg-opacity-30">
                   ?
                 </button>
                 <div className="absolute left-0 top-full mt-2 w-72 bg-white p-3 rounded-lg shadow-lg invisible group-hover:visible z-50 text-sm border border-gray-200 text-slate-900">
                   <p className="font-bold mb-2 text-slate-900">How to import events:</p>
                   <p className="font-bold mt-2 text-slate-900">Google Calendar:</p>
                   <ol className="list-decimal ml-4 mb-2">
                     <li className="text-slate-900">Open Google Calendar</li>
                     <li className="text-slate-900">Click + next to "Other Calendars"</li>
                     <li className="text-slate-900">Select "Import"</li>
                     <li className="text-slate-900">Upload the downloaded file</li>
                   </ol>
                   <p className="font-bold mt-2 text-slate-900">Outlook:</p>
                   <ol className="list-decimal ml-4">
                     <li className="text-slate-900">Double-click downloaded file</li>
                     <li className="text-slate-900">Outlook will open automatically</li>
                     <li className="text-slate-900">Click "Save & Close"</li>
                   </ol>
                 </div>
               </div>
             </>
           )}
         </div>

          {/* Active Users - Right side */}
          <div className="flex flex-wrap gap-2 justify-end items-center">
            {availableUsers.map(user => (
              <div key={user.name} className="relative">
                <button
                  onClick={() => setCurrentUser({
                    name: user.name,
                    color: 'bg-[#6B8E23] bg-opacity-20'
                  })}
                  className={`${currentUser?.name === user.name
                      ? 'bg-[#6B8E23] text-white'
                      : 'bg-[#6B8E23] bg-opacity-20 text-[#6B8E23]'
                    } px-3 py-1 rounded flex items-center gap-2 transition-colors`}
                >
                  <UserCircle className={`w-4 h-4 ${currentUser?.name === user.name ? 'text-white' : 'text-[#6B8E23]'}`} />
                  <span>{user.name}</span>
                </button>
              </div>
            ))}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleAddUser}
                className="px-3 py-1 rounded border border-[#6B8E23] text-[#6B8E23] hover:bg-[#6B8E23] hover:text-white transition-colors"
              >
                + New User
              </button>
              <button
                onClick={() => setShowUserManagement(true)}
                className="px-3 py-1 rounded border border-[#6B8E23] text-[#6B8E23] hover:bg-[#6B8E23] hover:text-white transition-colors"
              >
                Manage Users
              </button>
            </div>
          </div>  
          </div>
        <table className="w-full">
          <thead>
            <tr className="bg-[#FFD700] bg-opacity-10">
              <th className="p-2 text-left w-16 font-bold text-[#6B8E23]">Add to Calendar</th>
              <th className="p-2 text-left w-20 font-bold text-[#6B8E23]">Details</th>
              <th className="p-2 text-left w-24 font-bold text-[#6B8E23]">Date</th>
              <th className="p-2 text-left w-24 font-bold text-[#6B8E23]">Day</th>
              <th className="p-2 text-left font-bold text-[#6B8E23]">Service</th>
              <th className="p-2 text-left font-bold text-[#6B8E23]">Presentation Builder</th>
              <th className="p-2 text-center w-24 font-bold text-[#6B8E23]">Completed</th>
            </tr>
          </thead>
          <tbody>
            {dates.map((item, index) => (
              <React.Fragment key={item.date}>
                <tr className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                 <td className="p-2 border-r border-gray-300 text-center">
                    {signups[item.date] === currentUser?.name && (
                      <input
                        type="checkbox"
                        checked={selectedDates.includes(item.date)}
                        onChange={() => {
                          setSelectedDates(prev => 
                            prev.includes(item.date)
                              ? prev.filter(d => d !== item.date)
                              : [...prev, item.date]
                          );
                        }}
                        className="w-4 h-4 rounded border-gray-300 mx-auto"
                      />
                    )}
                  </td>
                  <td className="p-2 border-r border-gray-300">
                    <button 
                      onClick={() => setExpanded(prev => ({
                        ...prev,
                        [item.date]: !prev[item.date]
                      }))}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {expanded[item.date] ? <ChevronUp /> : <ChevronDown />}
                    </button>
                  </td>
                  <td className="p-2 border-r border-gray-300">{item.date}</td>
                  <td className="p-2 border-r border-gray-300">{item.day}</td>
                  <td className="p-2 border-r border-gray-300">{item.title}</td>
                  <td className="p-2 border-r border-gray-300">
                    {signups[item.date] ? (
                      <div className="p-2 rounded bg-[#6B8E23] bg-opacity-20 flex justify-between items-center">
                        {isLoading ? (
                          <span>Loading...</span>
                        ) : (
                          <>
                            <span>{signupDetails[item.date]?.name}</span>
                            {signups[item.date] === currentUser?.name && (
                              <button
                                onClick={() => handleRemoveReservation(item.date)}
                                className="ml-2 text-red-500 hover:text-red-700"
                                title="Remove reservation"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}       
                      </div>
                    ) : (
                      <button
                        onClick={async () => {  // Make the onClick handler async
                          if (!currentUser) {
                            setAlertMessage('Please select a user first');
                            setShowAlert(true);
                            setTimeout(() => setShowAlert(false), 3000);
                            return;
                          }
                          
                          try {
                            // Save to MongoDB
                            await fetch('/api/signups', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                date: item.date,
                                name: currentUser.name
                              })
                            });
      
                            // Update local state
                            setSignups(prev => ({
                              ...prev,
                              [item.date]: currentUser.name
                            }));
                            setSignupDetails(prev => ({
                              ...prev,
                              [item.date]: {
                                name: currentUser.name
                              }
                            }));

                            // Explicitly check if it's a future date
                            const [itemMonth, itemDay, shortYear] = item.date.split('/').map(num => parseInt(num, 10));
                            const itemYear = 2000 + shortYear; // Convert "25" to "2025"
                            const itemDate = new Date(itemYear, itemMonth - 1, itemDay); // month is 0-based in JS Date

                            const today = new Date('2025-01-14'); // Hardcode the current date since we're in test mode
                            today.setHours(0, 0, 0, 0);

                            console.log('Date comparison:', {
                              today: today.toLocaleDateString(),
                              signupDate: itemDate.toLocaleDateString(),
                              isInFuture: itemDate > today,
                              rawDates: {
                                today: today,
                                signupDate: itemDate,
                                year: itemYear // Added to verify year conversion
                              }
                            });

                            if (itemDate > today) {
                              setSelectedDates(prev => {
                                const newDates = [...prev, item.date];
                                console.log('Setting selected dates:', {
                                  previous: prev,
                                  adding: item.date,
                                  new: newDates
                                });
                                return newDates;
                              });
                            }  

                            setAlertMessage('Successfully signed up!');
                            setShowAlert(true);
                            setTimeout(() => setShowAlert(false), 3000);
                          } catch (error) {
                            console.error('Error saving signup:', error);
                            setAlertMessage('Error saving signup. Please try again.');
                            setShowAlert(true);
                            setTimeout(() => setShowAlert(false), 3000);
                          }
                        }}
                        className="w-full p-2 border rounded hover:bg-gray-50"
                      >
                        Sign Up
                      </button>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => handleCompleted(item.date)}
                      className={`w-6 h-6 rounded border ${
                        completed[item.date]
                          ? 'bg-[#6B8E23] border-[#556B2F]'
                          : 'bg-white border-gray-300'
                      } flex items-center justify-center`}
                    >
                      {completed[item.date] && <Check className="w-4 h-4 text-white" />}
                    </button>
                  </td>
                </tr>
                {expanded[item.date] && (
                  <tr>
                    <td colSpan="7" className="p-4 bg-gray-50">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Sermon Title</label>
                            <input
                              type="text"
                              className="w-full p-2 border rounded"
                              value={serviceDetails[item.date]?.sermonTitle || ''}
                              onChange={(e) => handleServiceDetailChange(item.date, 'sermonTitle', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">1st Reading</label>
                            <input
                              type="text"
                              className="w-full p-2 border rounded"
                              value={serviceDetails[item.date]?.firstReading || ''}
                              onChange={(e) => handleServiceDetailChange(item.date, 'firstReading', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">2nd Reading</label>
                            <input
                              type="text"
                              className="w-full p-2 border rounded"
                              value={serviceDetails[item.date]?.secondReading || ''}
                              onChange={(e) => handleServiceDetailChange(item.date, 'secondReading', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Gospel Reading</label>
                            <input
                              type="text"
                              className="w-full p-2 border rounded"
                              value={serviceDetails[item.date]?.gospelReading || ''}
                              onChange={(e) => handleServiceDetailChange(item.date, 'gospelReading', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Hymn #1</label>
                            <input
                              type="text"
                              className="w-full p-2 border rounded"
                              value={serviceDetails[item.date]?.hymnOne || ''}
                              onChange={(e) => handleServiceDetailChange(item.date, 'hymnOne', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Sermon Hymn</label>
                            <input
                              type="text"
                              className="w-full p-2 border rounded"
                              value={serviceDetails[item.date]?.sermonHymn || ''}
                              onChange={(e) => handleServiceDetailChange(item.date, 'sermonHymn', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Closing Hymn</label>
                            <input
                              type="text"
                              className="w-full p-2 border rounded"
                              value={serviceDetails[item.date]?.closingHymn || ''}
                              onChange={(e) => handleServiceDetailChange(item.date, 'closingHymn', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Notes</label>
                            <textarea
                              className="w-full p-2 border rounded"
                              rows="2"
                              value={serviceDetails[item.date]?.notes || ''}
                              onChange={(e) => handleServiceDetailChange(item.date, 'notes', e.target.value)}
                              placeholder="Add any special instructions or notes..."
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            </tbody>
          </table>
          {showUserManagement && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-[#6B8E23]">Manage Users</h2>
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
                  {availableUsers.map(user => (
                    <div key={user.name} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`delete-${user.name}`}
                        checked={usersToDelete.includes(user.name)}
                        onChange={(e) => {
                          setUsersToDelete(prev =>
                            e.target.checked
                              ? [...prev, user.name]
                              : prev.filter(name => name !== user.name)
                          );
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <label htmlFor={`delete-${user.name}`} className="text-black">
                        {user.name}
                      </label>
                    </div>
                  ))}
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => {
                        setShowUserManagement(false);
                        setUsersToDelete([]);
                      }}
                      className="px-4 py-2 rounded border border-[#6B8E23] text-[#6B8E23] hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (usersToDelete.length === 0) {
                          setAlertMessage('Please select users to remove');
                          setShowAlert(true);
                          setTimeout(() => setShowAlert(false), 3000);
                          return;
                        }

                        if (confirm(`Are you sure you want to remove ${usersToDelete.length} user${usersToDelete.length > 1 ? 's' : ''}?`)) {
                          for (const userName of usersToDelete) {
                            await handleRemoveUser(userName);
                          }
                          setShowUserManagement(false);
                          setUsersToDelete([]);
                          setAlertMessage('Users removed successfully');
                          setShowAlert(true);
                          setTimeout(() => setShowAlert(false), 3000);
                        }
                      }}
                      className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                    >
                      Remove Selected
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
};

export default SignupSheet;