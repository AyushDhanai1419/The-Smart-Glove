#include <SPI.h>
#include <EEPROM.h>
#include <boards.h>
#include <RBL_nRF8001.h>

//For LDR sensors
const int L1=A0;
const int L2=A1;
const int L3=A2;
const int L4=A3;
const int L5=A4;
int val1=0;
int val2=0;
int val3=0;
int val4=0;
int val5=0;
char ch[5];
int ctr=5,flag;

//For Buzzer
const int buzzer=3;

//For LED
const int LED=2;

void setup() {
  // put your setup code here, to run once:
  ble_set_name("SmartGlove");
  ble_begin();
Serial.begin(9600);
pinMode(buzzer,OUTPUT);
pinMode(LED,OUTPUT);
}

void loop() {

  //LED HIGH
    digitalWrite(LED,HIGH);
    
  // put your main code here, to run repeatedly:
val1=analogRead(L1);
val2=analogRead(L2);
val3=analogRead(L3);
val4=analogRead(L4);
val5=analogRead(L5);

if(val1<80)
{
  ch[4]='1';
}
else{
  ch[4]='0';
}
if(val2<80)
{
  ch[3]='1';
}
else
{
  ch[3]='0';
}
if(val3<80)
{
  ch[2]='1';
}
else
{
  ch[2]='0';
}
if(val4<80)
{
  ch[1]='1';
}
else
{
  ch[1]='0';
}
if(val5<80)
{
  ch[0]='1';
}
else
{
  ch[0]='0';
}
ch[5]='\0';
flag=0;
ctr=5;
while(ctr>0){
 ctr=ctr-1;
  if(ch[ctr]=='1')
  {
    flag=1;
    break;
  }
  
}
if(flag==1)
 {
  Serial.println(ch);
  
  if(ble_connected()){
   ble_write(ch[0]);
   ble_write(ch[1]);
   ble_write(ch[2]);
   ble_write(ch[3]);
   ble_write(ch[4]);
  }
  //LED Low
    digitalWrite(LED,LOW); 
    //For Buzzer
    digitalWrite(buzzer, HIGH);
    delay(50);
    digitalWrite(buzzer, LOW);
    delay(50);
 }
 /*
Serial.println(val5);
Serial.println(val4);
Serial.println(val3);
Serial.println(val2);
Serial.println(val1);*/

delay(1000);

ble_do_events();
 
  if ( ble_available() )
  {
    while ( ble_available() )
    {
      Serial.write(ble_read());
    }
    
    Serial.println();
  }
}

