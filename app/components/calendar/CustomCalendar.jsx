import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

const CustomCalendar = ({ 
  initialDate = new Date(),
  renderDay,
  onMonthChange,
  headerStyle = {},
  calendarStyle = {},
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(initialDate));
  
  // Get days in month
  const getDaysInMonth = useCallback((date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get the day of week for the first day (0 = Sunday, 6 = Saturday)
    const startingDay = firstDay.getDay();
    
    // Create array for all days in the month
    const days = [];
    
    // Add empty days for the start of the month
    for (let i = 0; i < startingDay; i++) {
      days.push({ id: `empty-start-${i}`, date: null, state: 'disabled' });
    }
    
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      days.push({ 
        id: `day-${i}`, 
        date: {
          year: dayDate.getFullYear(),
          month: dayDate.getMonth() + 1,
          day: dayDate.getDate(),
          timestamp: dayDate.getTime(),
          dateString: formatDate(dayDate)
        },
        state: 'enabled'
      });
    }
    
    // Add empty days to complete the grid
    const totalCells = Math.ceil(days.length / 7) * 7;
    let emptyEndIndex = 0;
    while (days.length < totalCells) {
      days.push({ id: `empty-end-${emptyEndIndex++}`, date: null, state: 'disabled' });
    }
    
    return days;
  }, []);
  
  // Format date to YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Change month
  const changeMonth = (increment) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setCurrentMonth(newMonth);
    
    if (onMonthChange) {
      onMonthChange({
        year: newMonth.getFullYear(),
        month: newMonth.getMonth() + 1,
        timestamp: newMonth.getTime()
      });
    }
  };
  
  // Get days for current month
  const days = getDaysInMonth(currentMonth);
  
  // Weekdays starting with Sunday
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  // Get month and year string
  const monthYear = currentMonth.toLocaleString('default', { 
    month: 'long',
    year: 'numeric'
  });
  
  // Calculate dimensions
  const screenWidth = Dimensions.get('window').width;
  const calendarWidth = screenWidth - 32; // 16px padding on each side
  
  // Group days into weeks for better layout control
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  
  return (
    <View style={[{ width: calendarWidth, alignSelf: 'center' }, calendarStyle]}>
      {/* Header */}
      <View style={[{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16,
        marginBottom: 20
      }, headerStyle]}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={{ padding: 8 }}>
          <ChevronLeft size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: '600', color: '#111827' }}>
          {monthYear}
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={{ padding: 8 }}>
          <ChevronRight size={24} color="#333333" />
        </TouchableOpacity>
      </View>
      
      {/* Weekday headers */}
      <View style={{ 
        flexDirection: 'row', 
        marginBottom: 14,
      }}>
        {weekDays.map((day, index) => (
          <View 
            key={index} 
            style={{ 
              flex: 1,
              alignItems: 'center'
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#9ca3af' }}>
              {day}
            </Text>
          </View>
        ))}
      </View>
      
      {/* Calendar grid - organized by weeks for better layout control */}
      <View style={{ width: '100%' }}>
        {weeks.map((week, weekIndex) => (
          <View 
            key={`week-${weekIndex}`} 
            style={{ 
              flexDirection: 'row',
              width: '100%',
              marginBottom: 8,
            }}>
            {week.map((day) => (
              <View 
                key={day.id} 
                style={{ 
                  flex: 1,
                }}
              >
                {renderDay ? renderDay(day) : (
                  <View style={{ 
                    height: 70,
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <Text style={{ 
                      fontSize: 12,
                      color: day.state === 'disabled' ? '#e5e7eb' : '#4b5563'
                    }}>
                      {day.date?.day || ''}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

export default CustomCalendar; 