"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Spinner,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { CheckCircleIcon, CloseIcon } from "@chakra-ui/icons";
import NavigationBar from "@/components/NavigationBar";
import { useUser } from "@/context/context";

interface Question {
  text: string;
  options: string[];
  answer: string;
}
type UserData = {
  id: string;
  telegramId: string;
  username: string;
  photoUrl?: string; // Optional field
  level: number;
  coins: number;
  taps: number;
  maxTaps: number;
  refillRate: number;
  lastRefillTime: Date;
  slots: number;
  referralCount: number;
  referredBy?: string; // Optional field
  freeSpins: number;
  multitap: number;
  tapLimitBoost: number;
  tappingGuruUses: number;
  profitPerHour: number;
  lastEarningsUpdate: Date;
  lastCheckIn?: Date; // Optional field
  lastTriviaAttempt?: Date,
  checkInStreak: number;
  createdAt: Date;
  updatedAt: Date;
};

type UpdateData = Partial<UserData>;

export default function Trivia() {
  const {user, setUser} = useUser()
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [score, setScore] = useState<number | null>(null);
  const toast = useToast()
  const [loading, setLoading] = useState<boolean>(true);
  const { isOpen, onOpen, onClose } = useDisclosure(); // Modal control
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const fetchTrivia = async () => {
      try {
        const response = await fetch("/api/trivia");
        if (!response.ok) {
          throw new Error("Failed to fetch trivia questions");
        }
        const data = await response.json();
        setQuestions(data);
        console.log(data);
      } catch (error) {
        console.error("Error fetching trivia questions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrivia();
  }, []);

  const handleNextQuestion = () => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = selectedValue;
    setSelectedAnswers(newAnswers);
    setSelectedValue("");

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

   const handleSubmit = async () => {
     // Ensure the last selected answer is stored before submitting
     const newAnswers = [...selectedAnswers];
     newAnswers[currentQuestionIndex] = selectedValue;
     setSelectedAnswers(newAnswers);

     let correctCount = 0;

     newAnswers.forEach((answer, index) => {
       if (answer === questions[index].answer) {
         correctCount++;
       }
     });
     const now= new Date()
     setScore(correctCount);
     const updatedUser = await updateUserProfile({lastTriviaAttempt: now })
     setUser(updatedUser)
     onOpen(); // Open the modal
   };

     const updateUserProfile = async (updatedFields: UpdateData) => {
       if (!user || !user.telegramId) {
         console.error("User data or telegramId is missing.");
         return;
       }

       try {
         const response = await fetch(
           `/api/updateprofile?userId=${user.telegramId}`,
           {
             method: "PATCH",
             headers: {
               "Content-Type": "application/json",
             },
             body: JSON.stringify(updatedFields),
           }
         );

         if (!response.ok) {
           const errorText = await response.text(); // Read raw text to handle empty responses
           console.error(
             "Failed to update profile:",
             errorText || "Unknown error"
           );
           return null;
         }

         const updatedUser = await response.json();
         console.log("Profile updated successfully:", updatedUser);
         return updatedUser; // Return the updated user if needed
       } catch (error) {
         console.error("Error updating profile:", error);
       }
     };


   const handleClaim =async()=>{
    console.log("score from handleclaim",score)
    if (!user || score !== questions.length){
      onClose()
      return;
    }
    try {
      const updateduser = await updateUserProfile({coins: user.coins + 100})
      toast({
        title: "Claim Successful",
        description: "You've successfully claimed 100xp",
        duration: 3000,
        isClosable: true
      })
      setUser(updateduser)
      onClose();
    } catch (error) {
      console.log(error)
    }
   }

   useEffect(()=>{
     const calculateTimeLeft = () => {
       if (!user || !user.lastTriviaAttempt) return; 
         const now = new Date();
         const nextReset = new Date(user.lastTriviaAttempt); // This will only execute if lastTriviaAttempt exists
         nextReset.setDate(nextReset.getDate() + 1); // Next reset at 24 hours

         const timeDiff = nextReset.getTime() - now.getTime();

         if (timeDiff > 0) {
           const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
           const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
           const seconds = Math.floor((timeDiff / 1000) % 60);

           setTimeLeft(
             `${hours.toString().padStart(2, "0")}:${minutes
               .toString()
               .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
           );
         } 
     };

     // Run the timer every second
     const timer = setInterval(calculateTimeLeft, 1000);
     return () => clearInterval(timer);
   }, [user])

  if (loading) {
    return (
      <Flex
        justifyContent="center"
        alignItems="center"
        w="full"
        height="100vh"
        direction="column"
      >
        <Spinner size="xl" />
      </Flex>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Box
      display="flex"
      flexDirection="column"
      bgGradient="linear-gradient(360deg, #00283A 0%, #12161E 88.17%)"
      width="100vw"
      minHeight="100vh"
      alignItems="center"
      textColor="white"
      overflow="hidden"
    >
      <Flex
        width="100%"
        height="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        pt={12}
        gap={5}
        pb={32}
      >
        <Text color="#93BAFF" fontWeight="700" fontSize="24px">
          Crypto Trivia
        </Text>

        <Box width="100%" display="flex" flexDirection="column" gap={4} mt={10}>
          <Text
            width="100%"
            px={10}
            textAlign="center"
            display="flex"
            justifyContent="center"
            alignItems="center"
            fontSize="35px"
            lineHeight="42.36px"
            fontWeight={700}
          >
            {currentQuestion.text}
          </Text>

          <Box py="15px" mt={5} w="90%" mx="auto">
            {currentQuestion.options.map((option, id) => (
              <Box
                key={id}
                p="2px"
                bgGradient="conic-gradient(from 180deg at 50% 50%, #19388A 0deg, #1A59FF 25.2deg, #D9D9D9 117deg, #1948C1 212.4deg, #F5F5F5 284.4deg, #19388A 360deg)"
                borderRadius="10px"
                mb={3}
              >
                <Button
                  onClick={() => setSelectedValue(option)}
                  bg={
                    selectedValue === option
                      ? "linear-gradient(90deg, #4979D1 0%, #4979D1 52.17%, #ADC9FE 100%)"
                      : "#293042"
                  }
                  color="white"
                  _hover={{
                    bg: "linear-gradient(90deg, #4979D1 0%, #4979D1 52.17%, #ADC9FE 100%)",
                  }}
                  _focus={{
                    bg: "linear-gradient(90deg, #4979D1 0%, #4979D1 52.17%, #ADC9FE 100%)",
                  }}
                  w="100%"
                  minHeight="69px"
                  borderRadius="10px"
                  fontSize="20px"
                  fontWeight={600}
                  textAlign="center"
                  whiteSpace="normal"
                >
                  {option}
                </Button>
              </Box>
            ))}
          </Box>

          <Box
            p="2px"
            bgGradient="conic-gradient(from 180deg at 50% 50%, #19388A 0deg, #1A59FF 25.2deg, #D9D9D9 117deg, #1948C1 212.4deg, #F5F5F5 284.4deg, #19388A 360deg)"
            borderRadius="20px"
            mx="auto"
            w="80%"
          >
            <Button
              onClick={() =>
                currentQuestionIndex >= questions.length - 1
                  ? handleSubmit()
                  : handleNextQuestion()
              }
              w="100%"
              h="49px"
              fontSize="24px"
              color="#f5f5f5"
              fontWeight={700}
              borderRadius="20px"
              bg="#4979D1"
              _hover={{ bg: "#4979D1" }}
              isDisabled={!selectedValue || timeLeft !== "" }
              _disabled={{ bg: "#293042" }}
            >
              {timeLeft === "00:00:00" || timeLeft === "" ? "Submit" : timeLeft}
            </Button>
          </Box>
        </Box>
      </Flex>

      <NavigationBar />

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
        <ModalContent
          alignItems={"center"}
          p={6}
          height={"300px"}
          bgGradient="linear-gradient(360deg, #00283A 0%, #12161E 88.17%)"
          color={"white"}
        >
          {score === questions.length ? (
            <Icon as={CheckCircleIcon} boxSize={16} color="green.400" mb={3} /> // Green check icon for perfect score
          ) : (
            <Icon as={CloseIcon} boxSize={16} color="red.400" mb={3} /> // Red X icon for incorrect answers
          )}

          <ModalHeader>
            {score === questions.length
              ? "Perfect Score!"
              : "Good Effort!, Try again soon"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody mt={-4}>
            <Text fontSize="20px" textAlign={"center"}>
              You answered {score} out of {questions.length} questions
              correctly!
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              onClick={handleClaim}
              isDisabled={score !== questions.length} // Only enable for perfect score
            >
              {score === questions.length
                ? "Claim 100 XP"
                : "Try Again Tomorrow"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
