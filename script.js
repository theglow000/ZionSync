import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Check, X, Mail, UserCircle, Trash2, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    { date: '12/21/25', day: 'Sunday', title: 'Advent 4 Kid\'s Christmas Program' },
    { date: '12/24/25', day: 'Wednesday', title: 'Christmas Eve 3pm' },
    { date: '12/24/25', day: 'Wednesday', title: 'Christmas Eve 7pm' },
    { date: '12/28/25', day: 'Sunday', title: 'Christmas Week 1' }
  ];

  const [serviceDetails, setServiceDetails] = useState({
    '1/5/25': {
      sermonTitle: 'Our Lord Revealed',
      gospelReading: 'Matthew 2:1-12',
      hymnOne: 'God Rest Ye Merry, Gentlemen',
      sermonHymn: 'Angels From the Realms of Glory (Green pg50 Cranberry 275)',
      closingHymn: 'I Lift My Hands Chris Tomlin'
    },
    '1/12/25': {
      sermonTitle: 'Baptism in Christ',
      gospelReading: 'Luke 3:15-17; 21-22',
      hymnOne: 'Just a Closer Walk with Thee #697 (cranberry)',
      sermonHymn: 'Holy Water by We the Kingdom',
      closingHymn: 'Come Thou Font of Every Blessing'
    },
    '1/19/25': {
      sermonTitle: 'Thanks Be to God',
      gospelReading: 'John 2:1-11',
      hymnOne: 'Blessed Assurance WOV #699',
      sermonHymn: 'Open the Eyes of My Heart CCLI top 100 #50',
      closingHymn: 'Shine, Jesus, Shine WOV #651'
    },
    '1/26/25': {
      sermonTitle: 'Justice in the Lord',
      gospelReading: 'Luke 4:14-21',
      hymnOne: 'A Mighty Fortress is Our God Cranberry 503',
      sermonHymn: 'Holy, Holy, Holy, Lord God Almighty Cranberry 413',
      closingHymn: 'Shine, Jesus Shine Cranberry 671'
    },
    '2/2/25': {
      sermonTitle: 'The Son of Man',
      gospelReading: 'Luke 2:22-40',
      hymnOne: '',
      sermonHymn: '',
      closingHymn: ''
    },
    '2/9/25': {
      sermonTitle: 'Here I am Lord',
      gospelReading: 'Luke 5:1-11',
      hymnOne: 'Here I am Lord (574 Cranberry)',
      sermonHymn: 'I will Rise by Chris Tomlin',
      closingHymn: 'Lord Prepare Me to be a Sanctuary'
    },
    '2/16/25': {
      sermonTitle: 'Blessed are the Poor and Hungry',
      gospelReading: 'Luke 6:17-26',
      hymnOne: '10,000 Reasons CCLI top 100 #10',
      sermonHymn: 'What a Friend We Have in Jesus Cranberry #742',
      closingHymn: 'My Hope is Built on Nothing Less Cranberry #596'
    },
    '2/23/25': {
      sermonTitle: 'Love Overcome Hatred',
      gospelReading: 'Luke 6:27-38',
      hymnOne: 'O God of Every Nation Cranberry 713',
      sermonHymn: 'Open Our Eyes, Lord Life Songs 31',
      closingHymn: 'Take My Life, That I May Be Cranberry 685'
    },
    '3/2/25': {
      sermonTitle: 'The Transfiguration of Jesus',
      gospelReading: 'Luke 9:28-36 [37-43a]',
      hymnOne: '',
      sermonHymn: '',
      closingHymn: ''
    },
    '3/5/25': {
      sermonTitle: 'Real Faith',
      gospelReading: 'Matt 6:1-6, 16-21',
      hymnOne: '',
      sermonHymn: '',
      closingHymn: ''
    }
  });

  const handleServiceDetailChange = (date, field, value) => {
    setServiceDetails(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [field]: value
      }
    }));
  };

  const showAlertMessage = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleSignup = () => {
    const nameInput = document.querySelector('input[name="name"]');
    const emailInput = document.querySelector('input[name="email"]');
    
    if (!nameInput || !emailInput) return;
    
    const name = nameInput.value;
    const email = emailInput.value;
    
    if (!name || !email) return;

    const newUser = {
      name,
      email,
      color: 'bg-blue-100'
    };

    setCurrentUser(newUser);
    setSignups(prev => ({
      ...prev,
      [currentDate]: email
    }));

    setSelectedDates(prev => [...prev, currentDate]);
    setShowRegistration(false);
    showAlertMessage('Successfully signed up! Date added to calendar selection.');
  };

  const handleRemoveReservation = (date) => {
    if (!currentUser) return;
    
    if (signups[date] === currentUser.email) {
      setSignups(prev => {
        const newSignups = { ...prev };
        delete newSignups[date];
        return newSignups;
      });
      setSelectedDates(prev => prev.filter(d => d !== date));
      showAlertMessage('Reservation removed successfully');
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto relative">
      {showAlert && (
        <Alert className="absolute top-4 right-4 w-96 bg-green-100">
          <Mail className="w-4 h-4" />
          <AlertDescription>{alertMessage}</AlertDescription>
        </Alert>
      )}

      {showRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Sign Up for Service</h2>
              <button 
                onClick={() => setShowRegistration(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  required
                  name="name"
                  type="text"
                  className="w-full p-2 border rounded"
                  placeholder="Enter your name"
                  defaultValue={currentUser?.name || ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  required
                  name="email"
                  type="email"
                  className="w-full p-2 border rounded"
                  placeholder="Enter your email"
                  defaultValue={currentUser?.email || ''}
                />
              </div>
              <button
                onClick={handleSignup}
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      )}

      <CardHeader>
        <h1 className="text-2xl font-bold text-center">Proclaim Presentation Team Sign-up Sheet</h1>
        <p className="text-center text-gray-600">2025 Service Schedule</p>
      </CardHeader>

      <CardContent>
        <div className="flex justify-between mb-4">
          {selectedDates.length > 0 && currentUser && (
            <button
              onClick={() => showAlertMessage('Calendar download will be available when deployed')}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Download {selectedDates.length} Calendar Events
            </button>
          )}
          {currentUser && (
            <div className={`px-3 py-1 rounded ${currentUser.color} flex items-center`}>
              <UserCircle className="w-4 h-4 mr-2" />
              <span>{currentUser.name}</span>
            </div>
          )}
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left w-24">Add to Calendar</th>
              <th className="p-2 text-left w-20">Details</th>
              <th className="p-2 text-left w-24">Date</th>
              <th className="p-2 text-left w-24">Day</th>
              <th className="p-2 text-left">Service</th>
              <th className="p-2 text-left">Presentation Builder</th>
              <th className="p-2 text-center w-24">Completed</th>
            </tr>
          </thead>
          <tbody>
            {dates.map((item, index) => (
              <React.Fragment key={item.date}>
                <tr className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="p-2">
                    {signups[item.date] === currentUser?.email && (
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
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    )}
                  </td>
                  <td className="p-2">
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
                  <td className="p-2">{item.date}</td>
                  <td className="p-2">{item.day}</td>
                  <td className="p-2">{item.title}</td>
                  <td className="p-2">
                    {signups[item.date] ? (
                      <div className={`p-2 rounded ${currentUser?.color} flex justify-between items-center`}>
                        <span>{currentUser?.name}</span>
                        {currentUser?.email === signups[item.date] && (
                          <button
                            onClick={() => handleRemoveReservation(item.date)}
                            className="ml-2 text-red-500 hover:text-red-700"
                            title="Remove reservation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setCurrentDate(item.date);
                          setShowRegistration(true);
                        }}
                        className="w-full p-2 border rounded hover:bg-gray-50"
                      >
                        Sign Up
                      </button>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => setCompleted(prev => ({
                        ...prev,
                        [item.date]: !prev[item.date]
                      }))}
                      className={`w-6 h-6 rounded border ${
                        completed[item.date]
                          ? 'bg-green-500 border-green-600'
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
      </CardContent>
    </Card>
  );
};

export default SignupSheet;
